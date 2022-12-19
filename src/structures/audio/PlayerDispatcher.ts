import { Client } from "../Client";
import { Queue } from "./Queue";
import {
  PlayerUpdate,
  Player,
  TrackEndEvent,
  TrackExceptionEvent,
  WebSocketClosedEvent,
} from "shoukaku";
import { Logger } from "tslog";
import {
  IAudioTrack,
  IGuildAudioData,
  IJoinOptions,
  RepeatMode,
} from "../../types";
import * as Sentry from "@sentry/node";
import { AudioMessage } from "./AudioMessage";
import { ReusableFormatFunction } from "../../locales/LocalePicker";
import { Formatter } from "../../utils";
import { Guild } from "../../database/mysql/entities";
import { BreakOnDestroyed } from "./PlayerDecorator";

export class PlayerDispatcher {
  public client: Client;
  public player: Player;
  public queue: Queue;
  public audioMessage: AudioMessage;
  public log: Logger;
  public playedRelatedTracks: string[];

  private guildId: string;
  private _destroyed = false;
  constructor(client: Client, player: Player, joinOptions: IJoinOptions) {
    this.client = client;
    this.player = player;
    this.guildId = this.player.connection.guildId;
    this.log = this.client.log.getChildLogger({
      name: this.client.log.settings.name + "/PlayerDispatcher/" + this.guildId,
    });
    this.queue = new Queue(this.guildId, this.client.databaseHelper, this.log);
    this.audioMessage = new AudioMessage(
      this.client,
      this.guildId,
      joinOptions.textChannelId,
      this.log
    );
  }

  @BreakOnDestroyed()
  registerPlayerEvent() {
    this.player.on("closed", (...args) => this.onClosed(...args));
    this.player.on("end", (...args) => this.onEnd(...args));
    this.player.on("update", (...args) => this.onUpdate(...args));
    this.player.on("exception", (...args) => this.onException(...args));
  }

  @BreakOnDestroyed()
  private async onClosed(reason: WebSocketClosedEvent) {
    this.log.warn(`Websocket closed`, reason || "No reason");
    this.destroy();
    const friendlyErrorCodes = [4014];
    if (friendlyErrorCodes.includes(reason.code)) {
      await this.sendDisconnected();
    }
  }

  @BreakOnDestroyed()
  private async onUpdate(data: PlayerUpdate) {
    const { position, connected } = data.state;
    if (!position) {
      this.log.debug(`PlayerUpdate data is not containing position data.`);
    } else {
      this.log.debug(
        `Update position data to ${
          data.state.connected ? data.state.position : null
        }`
      );
      await this.queue.setPosition(connected ? position : null);
    }
  }

  @BreakOnDestroyed()
  private async onException(exception: TrackExceptionEvent) {
    // TODO: 플레이어 핸들이 안되어 있음
    this.log.error(`Error while playback`, exception);
    Sentry.captureException(exception);
  }

  @BreakOnDestroyed()
  private async onEnd(trackEndEvent: TrackEndEvent) {
    this.log.debug(
      `Track ended, playing next item or handle repeat/related`,
      trackEndEvent.reason || "No reason"
    );
    switch (trackEndEvent.reason) {
      case "FINISHED":
        try {
          const guildConfig: Guild =
            await this.client.databaseHelper.upsertAndFindGuild(this.guildId);
          if (guildConfig.repeat !== RepeatMode.OFF) {
            this.log.debug(`Trying handle repeat ${guildConfig.repeat}`);
            await this.handleRepeat(guildConfig.repeat);
            return;
          } else {
            await this.playNextTrack();
          }
        } catch (error) {
          const exceptionId = Sentry.captureException(error);
          this.log.error(`Failed to playing next track`, error);
          this.handleError(exceptionId);
        }
        break;
      case "REPLACED":
        this.log.debug("Track replaced, ignore end event.");
        break;
      case "CLEANUP":
        this.log.debug(`Cleanup received, clean dispatcher.`);
        this.destroy();
        break;
      case "LOAD_FAILED":
        this.log.warn("Track load failed, skip track.");
        // Something message send
        await this.skipTrack();
        break;
      default:
        this.log.warn(`Unknown track end event. ${trackEndEvent.reason}`);
        await this.playNextTrack();
        break;
    }
  }

  @BreakOnDestroyed()
  public async addTracks(tracks: IAudioTrack[]): Promise<number> {
    this.log.debug(`Add tracks ${tracks.length}`);
    await this.queue.pushTracks(tracks);
    await this.playOrResumeOrNothing();
    return tracks.length;
  }

  @BreakOnDestroyed()
  public async addTrack(track: IAudioTrack): Promise<IAudioTrack> {
    this.log.debug(`Add track ${track.track.info.identifier}`);
    await this.queue.pushTrack(track);
    await this.playOrResumeOrNothing();
    return track;
  }

  public async sendDisconnected(): Promise<void> {
    await this.audioMessage.sendMessage(
      await this.audioMessage.format("DISCONNECT_ERROR")
    );
  }

  public async seekTo(seekTo: number): Promise<this> {
    this.log.debug(`Seek player to ${seekTo}`);
    this.player.seekTo(seekTo);
    await this.queue.setPosition(seekTo);
    return this;
  }

  @BreakOnDestroyed()
  public async playOrResumeOrNothing(): Promise<IAudioTrack | void> {
    const { nowPlaying, queue } = await this.queue.getGuildAudioData();
    if (nowPlaying && !this.player.track) {
      this.log.debug(
        `Database nowplaying is exists, but player is not. resuming`
      );
      return await this.resumeNowPlaying(nowPlaying);
    } else if (!this.player.track && queue.length > 0) {
      this.log.debug(`Player is nothing to playing, playing next track`);
      return await this.playNextTrack();
    } else {
      this.log.debug(
        `This player is already playing. just push track to queue`
      );
      return;
    }
  }

  @BreakOnDestroyed()
  private async playNextTrack(): Promise<IAudioTrack | void> {
    this.log.debug(`Playing next track`);
    const guildConfig: Guild =
      await this.client.databaseHelper.upsertAndFindGuild(this.guildId);
    const toPlay: IAudioTrack | null = await this.queue.shiftTrack();
    if (toPlay) {
      await this.playTrack(toPlay, guildConfig.volume);
      return toPlay;
    } else if (
      guildConfig.repeat === RepeatMode.OFF &&
      guildConfig.playRelated
    ) {
      this.log.debug(
        `Nothing to playing next, but related playing is enabled. trying handle related videos...`
      );
      await this.playRelated();
      return;
    } else {
      this.log.debug(`Nothing to playing next. Stop & clean PlayerDispatcher`);
      await this.stopPlayer();
      return;
    }
  }

  @BreakOnDestroyed()
  private async playRelated(): Promise<void> {
    // Related track handle
    const beforeTrack: IAudioTrack | null = await this.queue.getNowPlaying();
    const format: ReusableFormatFunction =
      await this.audioMessage.getReusableFormatFunction();
    if (
      !beforeTrack ||
      beforeTrack.track.info.sourceName !== "youtube" ||
      !beforeTrack.track.info.identifier
    ) {
      // Youtube only message send & clean disconnect
      this.log.debug(
        "beforeTrack is not youtube video or beforeTrack is not exists. Stop & clean PlayerDispatcher"
      );
      await this.audioMessage.sendMessage(format("RELATED_ONLY_YOUTUBE"));
      await this.cleanStop();
    } else {
      // Handle related
      try {
        const relatedVideo: IAudioTrack | null =
          await this.client.audio.getRelatedVideo(
            beforeTrack.track.info.identifier
          );
        if (!relatedVideo) {
          // 추천 영상을 찾지 못했어요.
          await this.audioMessage.sendMessage(format("RELATED_FAILED"));
          await this.cleanStop();
        } else {
          // Play Next Track
          await this.queue.pushTrack(relatedVideo);
          await this.playNextTrack();
        }
      } catch (error) {
        const exceptionId: string = Sentry.captureException(error);
        this.log.error("Failed to scrape related video.", error);
        // 추천 영상을 가져오는 도중 오류가 발생했어요! 노래를 종료할게요.
        await this.cleanStop();
        await this.audioMessage.sendMessage(
          format("RELATED_SCRAPE_ERROR", exceptionId)
        );
      }
    }
  }

  @BreakOnDestroyed()
  private async handleRepeat(repeatStatus: RepeatMode): Promise<void> {
    const beforeTrack: IAudioTrack | null = await this.queue.getNowPlaying();
    if (!beforeTrack) {
      this.log.debug(
        "Tried handle repeat but, beforeTrack is not exists. Trying play next track."
      );
      await this.playNextTrack();
      return;
    }
    switch (repeatStatus) {
      case RepeatMode.ALL:
        beforeTrack.repeated = true;
        await this.queue.pushTrack(beforeTrack);
        await this.playNextTrack();
        this.log.debug(
          `(Repeat.ALL) Successfully re-enqueued nowplaying to queue & invoke playNextTrack.`
        );
        break;
      case RepeatMode.SINGLE:
        beforeTrack.repeated = true;
        await this.queue.unshiftTrack(beforeTrack);
        await this.playNextTrack();
        this.log.debug(
          `(Repeat.SINGLE) Successfully re-enqueued track to position 0 & invoke playNextTrack.`
        );
        break;
    }
  }

  @BreakOnDestroyed()
  private async resumeNowPlaying(nowPlaying: IAudioTrack) {
    // Player track = null, DB nowplaying = exists
    const guildConfig = await this.client.databaseHelper.upsertAndFindGuild(
      this.guildId
    );
    const { position }: IGuildAudioData =
      await this.client.databaseHelper.upsertGuildAudioData(this.guildId);
    if (!nowPlaying || nowPlaying?.track.info.isStream || !position) {
      this.log.debug(
        nowPlaying?.track.info.isStream
          ? `Nowplaying is stream or position is not exist, skipping...`
          : `Nowplaying data not found. but resumeNowplaying option provided. trying without resumeNowPlaying`
      );
      return this.playNextTrack();
    }
    await this.playTrack(nowPlaying, guildConfig.volume, position);
    return nowPlaying;
  }

  @BreakOnDestroyed()
  private async playTrack(
    toPlay: IAudioTrack,
    volume: number,
    position?: number
  ): Promise<Player> {
    this.log.debug(
      `Playing track with volume ${volume} ${
        position ? "with position " + position : ""
      }`
    );
    const format: ReusableFormatFunction =
      await this.audioMessage.getReusableFormatFunction();
    const playingMessage: string = position
      ? format(
          "RESUMED_PLAYING",
          Formatter.formatTrack(toPlay.track, format("LIVESTREAM")),
          Formatter.humanizeSeconds(position, true)
        )
      : toPlay.relatedTrack
      ? format(
          "PLAYING_NOW_RELATED",
          Formatter.formatTrack(toPlay.track, format("LIVESTREAM"))
        )
      : format(
          "PLAYING_NOW",
          Formatter.formatTrack(toPlay.track, format("LIVESTREAM"))
        );
    await this.audioMessage.sendMessage(playingMessage);
    await this.queue.setNowPlaying(toPlay);
    this.setVolumePercent(volume);
    return this.player.playTrack({
      track: toPlay.track.track,
      options: {
        startTime: position,
        noReplace: false,
      },
    });
  }

  @BreakOnDestroyed()
  public async skipTrack(to?: number): Promise<void | IAudioTrack> {
    if (!to) {
      this.log.debug(`Skipped track @ ${this.guildId}`);
      return await this.playNextTrack();
    } else {
      this.log.debug(`Skip to #${to} @ ${this.guildId}`);
      await this.queue.skipTo(to);
      return await this.playNextTrack();
    }
  }

  @BreakOnDestroyed()
  public setVolumePercent(val: number): number {
    const calc = val / 100;
    this.log.debug(`Set player's volume to ${val}% (${calc})`);
    this.player.setVolume(calc);
    return val;
  }

  @BreakOnDestroyed()
  public async stopPlayer(): Promise<void> {
    await this.cleanStop();
    // Send Audio Message
    await this.audioMessage.sendMessage(
      await this.audioMessage.format("ENDED_PLAYBACK")
    );
  }

  @BreakOnDestroyed()
  public async cleanStop() {
    this.log.debug(`Clean queue & destroy dispatcher`);
    this.destroy();
    await this.queue.cleanQueue();
  }

  @BreakOnDestroyed()
  private async handleError(exceptionId: string): Promise<void> {
    this.destroy();
    await this.audioMessage.sendMessage(
      await this.audioMessage.format("PLAYBACK_ERROR", exceptionId)
    );
  }

  public get destroyed(): boolean {
    return this._destroyed;
  }

  public destroy() {
    this.log.debug(`Destroy PlayerDispatcher.`);
    this._destroyed = true;
    this.client.audio.deletePlayerDispatcher(this.guildId);
    this.client.audio.players.delete(this.guildId);
    this.player.connection.disconnect();
  }
}
