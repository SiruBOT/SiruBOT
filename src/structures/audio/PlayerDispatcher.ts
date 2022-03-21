import { AudioHandler } from "./AudioHandler";
import { Client } from "../Client";
import { Queue } from "./Queue";
import {
  PlayerUpdate,
  ShoukakuPlayer,
  TrackEndEvent,
  TrackExceptionEvent,
  WebSocketClosedEvent,
} from "shoukaku";
import locale from "../../locales";
import { Logger } from "tslog";
import { IAudioTrack, IGuildAudioData, RepeatMode } from "../../types";
import { DatabaseHelper } from "..";
import * as Sentry from "@sentry/node";
import { AudioMessage } from "./AudioMessage";
import { ReusableFormatFunction } from "../../locales/LocalePicker";
import { Formatter } from "../../utils";
import { EventEmitter } from "events";
import { Guild } from "../../database/mysql/entities";

export class PlayerDispatcher extends EventEmitter {
  public audio: AudioHandler;
  public client: Client;
  public player: ShoukakuPlayer;
  private guildId: string;
  public queue: Queue;
  private databaseHelper: DatabaseHelper;
  private audioMessage: AudioMessage;
  public log: Logger;
  constructor(
    audio: AudioHandler,
    player: ShoukakuPlayer,
    databaseHelper: DatabaseHelper,
    textChannelId: string
  ) {
    super();
    this.audio = audio;
    this.client = audio.client;
    this.player = player;
    this.guildId = player.connection.guildId;
    this.log = this.client.log.getChildLogger({
      name: this.client.log.settings.name + "/PlayerDispatcher/" + this.guildId,
    });
    this.databaseHelper = databaseHelper;
    this.audioMessage = new AudioMessage(
      this.client,
      this.guildId,
      textChannelId,
      this.databaseHelper,
      this.log
    );
    this.queue = new Queue(this.guildId, this.databaseHelper, this.log);
  }

  registerPlayerEvent() {
    this.player.on("closed", (...args) => this.onClosed(...args));
    this.player.on("end", (...args) => this.onEnd(...args));
    this.player.on("update", (...args) => this.onUpdate(...args));
    this.player.on("exception", (...args) => this.onException(...args));
  }

  private async onClosed(reason: WebSocketClosedEvent) {
    this.log.warn(`Websocket closed`, reason || "No reason");
    this.destroy();
    const friendlyErrorCodes = [4014];
    if (friendlyErrorCodes.includes(reason.code)) {
      await this.sendDisconnected();
    }
  }

  public async sendDisconnected(): Promise<void> {
    await this.audioMessage.sendMessage(
      await this.audioMessage.format("DISCONNECT_ERROR")
    );
  }

  private async onUpdate(data: PlayerUpdate) {
    const { position }: { position: number | undefined } = data.state;
    if (!position) {
      this.log.debug(`PlayerUpdate data is not containing position data.`);
    } else {
      this.log.debug(
        `Update position data to ${
          data.state.connected ? data.state.position : null
        }`
      );
      await this.queue.setPosition(
        data.state.connected ? data.state.position : null
      );
    }
  }

  private async onException(exception: TrackExceptionEvent) {
    this.log.error(`Error while playback`, exception);
    Sentry.captureException(exception);
  }

  private async onEnd(trackEndEvent: TrackEndEvent) {
    this.log.debug(
      `Track ended, playing next item or handle repeat/related`,
      trackEndEvent.reason || "No reason"
    );
    switch (trackEndEvent.reason) {
      case "FINISHED":
        try {
          const guildConfig: Guild =
            await this.databaseHelper.upsertAndFindGuild(this.guildId);
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

  public async addTracks(tracks: IAudioTrack[]): Promise<number> {
    this.log.debug(`Add tracks ${tracks.length}`);
    await this.queue.pushTracks(tracks);
    await this.playOrResumeOrNothing();
    return tracks.length;
  }

  public async addTrack(track: IAudioTrack): Promise<IAudioTrack> {
    this.log.debug(`Add track ${track.shoukakuTrack.info.identifier}`);
    await this.queue.pushTrack(track);
    await this.playOrResumeOrNothing();
    return track;
  }

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

  private async playNextTrack(): Promise<IAudioTrack | void> {
    this.log.debug(`Playing next track`);
    const guildConfig: Guild = await this.databaseHelper.upsertAndFindGuild(
      this.guildId
    );
    const toPlay: IAudioTrack | null = await this.queue.shiftTrack();
    if (toPlay) {
      this.playTrack(toPlay, guildConfig.volume);
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

  private async playRelated(): Promise<void> {
    // Related track handle
    const beforeTrack: IAudioTrack | null = await this.queue.getNowPlaying();
    const format: ReusableFormatFunction =
      await this.audioMessage.getReusableFormatFunction();
    if (
      !beforeTrack ||
      beforeTrack.shoukakuTrack.info.sourceName !== "youtube" ||
      !beforeTrack.shoukakuTrack.info.identifier
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
          await this.audio.getRelatedVideo(
            beforeTrack.shoukakuTrack.info.identifier
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
        // 추천 영상을 가져오는 도중 오류가 발생했어요! 노래를 종료할게요.
        await this.cleanStop();
        await this.audioMessage.sendMessage(
          format("RELATED_SCRAPE_ERROR", exceptionId)
        );
      }
    }
  }

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

  private async resumeNowPlaying(nowPlaying: IAudioTrack) {
    // Player track = null, DB nowplaying = exists
    const guildConfig = await this.databaseHelper.upsertAndFindGuild(
      this.guildId
    );
    const { position, positionUpdatedAt }: IGuildAudioData =
      await this.databaseHelper.upsertGuildAudioData(this.guildId);
    if (!nowPlaying || nowPlaying?.shoukakuTrack.info.isStream || !position) {
      this.log.debug(
        nowPlaying?.shoukakuTrack.info.isStream
          ? `Nowplaying is stream or position is not exist, skipping...`
          : `Nowplaying data not found. but resumeNowplaying option provided. trying without resumeNowPlaying`
      );
      return this.playNextTrack();
    }
    const calculatedPos: number =
      position +
      (positionUpdatedAt.getTime() <= 0
        ? 0
        : new Date().getTime() - positionUpdatedAt.getTime());
    this.log.debug(
      `Approximately Calculated nowplaying position: ${calculatedPos}`
    );
    const resumePosition: number =
      calculatedPos > (nowPlaying.shoukakuTrack.info.length ?? 0)
        ? 0
        : calculatedPos;
    await this.playTrack(nowPlaying, guildConfig.volume, resumePosition);
    return nowPlaying;
  }

  private async playTrack(
    toPlay: IAudioTrack,
    volume: number,
    position?: number
  ): Promise<ShoukakuPlayer> {
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
          Formatter.formatTrack(
            toPlay.shoukakuTrack,
            format("LIVESTREAM"),
            true
          ),
          Formatter.humanizeSeconds(position / 1000)
        )
      : toPlay.relatedTrack
      ? format(
          "PLAYING_NOW_RELATED",
          Formatter.formatTrack(
            toPlay.shoukakuTrack,
            format("LIVESTREAM"),
            true
          )
        )
      : format(
          "PLAYING_NOW",
          Formatter.formatTrack(
            toPlay.shoukakuTrack,
            format("LIVESTREAM"),
            true
          )
        );
    await this.audioMessage.sendMessage(playingMessage);
    await this.queue.setNowPlaying(toPlay);
    this.setVolumePercent(volume);
    return this.player.playTrack(toPlay.shoukakuTrack.track, {
      startTime: position,
      noReplace: false,
    });
  }

  public async skipTrack(
    to: number | null = null
  ): Promise<void | IAudioTrack> {
    if (!to) {
      this.log.debug("Skipped track");
      return await this.playNextTrack();
    } else {
      this.log.debug(`Skip to #${to}`);
      await this.queue.skipTo(to);
      return await this.playNextTrack();
    }
  }

  public setVolumePercent(val: number): number {
    const calc = val / 100;
    this.log.debug(`Set player's volume to ${val}% (${calc})`);
    this.player.setVolume(calc);
    return val;
  }

  public async stopPlayer(): Promise<void> {
    await this.cleanStop();
    // Send Audio Message
    await this.audioMessage.sendMessage({
      content: await this.audioMessage.format("ENDED_PLAYBACK"),
    });
  }

  public async cleanStop() {
    this.log.debug(`Clean queue & destroy dispatcher`);
    this.destroy();
    await this.queue.cleanQueue();
  }

  private async handleError(exceptionId: string): Promise<void> {
    this.destroy();
    await this.audioMessage.sendMessage({
      content: await this.audioMessage.format("PLAYBACK_ERROR", exceptionId),
    });
  }

  public destroy() {
    this.log.debug(`Destroy PlayerDispatcher.`);
    this.audio.dispatchers.delete(this.guildId);
    this.audio.players.delete(this.guildId);
    this.player.connection.disconnect();
  }
}
