import { Logger } from "tslog";
import * as Sentry from "@sentry/node";

import {
  PlayerUpdate,
  Player,
  TrackEndEvent,
  TrackExceptionEvent,
  WebSocketClosedEvent,
} from "shoukaku";

import { KafuuClient } from "@/structures/KafuuClient";
import {
  KafuuAudioTrack,
  KafuuJoinOptions,
  KafuuRepeatMode,
} from "@/types/audio";
import { AudioMessage, BreakOnDestroyed, Queue } from "@/structures/audio";
import { ReusableFormatFunc } from "@/types/locales";

import { formatTrack, humanizeSeconds } from "@/utils/formatter";
import { TypeORMGuild } from "@/models/typeorm";

export class PlayerDispatcher {
  public client: KafuuClient;
  public player: Player;
  public queue: Queue;
  public audioMessage: AudioMessage;
  public log: Logger;
  public playedYoutubeTracks: string[];

  private guildId: string;
  private _destroyed = false;
  constructor(
    client: KafuuClient,
    player: Player,
    joinOptions: KafuuJoinOptions
  ) {
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
    this.playedYoutubeTracks = [];
    this.setupDispatcher();
  }

  @BreakOnDestroyed()
  private setupDispatcher() {
    this.log.debug("Setup dispatcher events..");
    this.player.on("closed", (...args) => this.onClosed(...args));
    this.player.on("end", (...args) => this.onEnd(...args));
    this.player.on("update", (...args) => this.onUpdate(...args));
    this.player.on("exception", (...args) => this.onException(...args));
  }

  @BreakOnDestroyed()
  private async onClosed(reason: WebSocketClosedEvent) {
    const friendlyErrorCode = 4014;
    const resumeErrorCode = 4006;
    const reasonString = Object.entries(reason)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    switch (reason.code) {
      case friendlyErrorCode:
        this.log.warn(
          "Websocket closed, disconncted from user, (friendlyErrorCode) " +
            reasonString
        );
        this.destroy();
        await this.sendDisconnected();
        break;
      case resumeErrorCode:
        this.log.warn(
          "Websocket closed,  may be lavalink resume" + reasonString
        );
        break;
      default:
        this.log.warn("Websocket closed, unknown reason, " + reasonString);
        this.destroy();
        Sentry.captureEvent({
          message:
            "Unknown websocket closed event. " +
            reason.code +
            " " +
            reasonString,
        });
        break;
    }
  }

  @BreakOnDestroyed()
  private async onUpdate(data: PlayerUpdate) {
    const { position, connected } = data.state;
    if (!position) {
      this.log.debug(
        `PlayerUpdate data is not containing position data.`,
        data
      );
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
    this.destroy();
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
          const guildConfig: TypeORMGuild =
            await this.client.databaseHelper.upsertAndFindGuild(this.guildId);
          if (guildConfig.repeat !== KafuuRepeatMode.OFF) {
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
  public async addTracks(tracks: KafuuAudioTrack[]): Promise<number> {
    this.log.debug(`Add tracks ${tracks.length}`);
    await this.queue.pushTracks(tracks);
    await this.playOrResumeOrNothing();
    return tracks.length;
  }

  @BreakOnDestroyed()
  public async addTrack(track: KafuuAudioTrack): Promise<KafuuAudioTrack> {
    this.log.debug(`Add track ${track.info.identifier}`);
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
  public async playOrResumeOrNothing(): Promise<KafuuAudioTrack | void> {
    const { nowPlaying, queue, position } =
      await this.queue.getGuildAudioData();
    if (nowPlaying && position && !this.player.track) {
      this.log.debug(
        `Database nowplaying is exists, but player is not. resuming`
      );
      return await this.resumeNowPlaying(nowPlaying, position);
    }
    if (!this.player.track && queue.length > 0) {
      this.log.debug(
        `Player is nothing to playing but next track exists playing next track`
      );
      return await this.playNextTrack();
    }
    this.log.debug(`This player is already playing. just push track to queue`);
    return;
  }

  @BreakOnDestroyed()
  private async playNextTrack(): Promise<KafuuAudioTrack | void> {
    this.log.debug(`Playing next track`);
    const guildConfig: TypeORMGuild =
      await this.client.databaseHelper.upsertAndFindGuild(this.guildId);
    const toPlay: KafuuAudioTrack | null = await this.queue.shiftTrack();
    if (toPlay) {
      await this.playTrack(toPlay, guildConfig.volume);
      return toPlay;
    } else if (
      guildConfig.repeat === KafuuRepeatMode.OFF &&
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
    const format: ReusableFormatFunc =
      await this.audioMessage.getReusableFormatFunction();
    const beforeTrack = await this.queue.getNowPlaying();
    // 이전 트랙이 없거나, 이전 트랙이 유튜브가 아니면 종료
    if (!beforeTrack || beforeTrack.info.sourceName != "youtube") {
      this.log.debug(
        `Before track is not exists or identifier is not exists. Stop & clean PlayerDispatcher`
      );
      await this.audioMessage.sendMessage(format("RELATED_ONLY_YOUTUBE"));
      await this.cleanStop();
      return;
    }
    try {
      // Try scrape related video
      const relatedSearchResult = await this.client.audio.getRelatedVideo(
        beforeTrack.info.identifier
      );
      // When related video is not exists, stop player
      if (!relatedSearchResult) {
        await this.audioMessage.sendMessage(format("RELATED_FAILED"));
        await this.cleanStop();
        return;
      }
      // Push related video to queue
      await this.queue.pushTrack(relatedSearchResult);
      // Play next track
      await this.playNextTrack();
      return;
    } catch (error) {
      // When scrape related video is failed, stop player and capture Exception
      const exceptionId: string = Sentry.captureException(error);
      this.log.error("Failed to scrape related video.", error);
      // Send error message
      await this.audioMessage.sendMessage(
        format("RELATED_SCRAPE_ERROR", exceptionId)
      );
      await this.cleanStop();
      return;
    }
  }

  @BreakOnDestroyed()
  private async handleRepeat(repeatStatus: KafuuRepeatMode): Promise<void> {
    const beforeTrack: KafuuAudioTrack | null =
      await this.queue.getNowPlaying();
    // When before track is not exists, just play next track
    if (!beforeTrack) {
      this.log.debug(
        "Tried handle repeat but, beforeTrack is not exists. Trying play next track."
      );
      await this.playNextTrack();
      return;
    }
    switch (repeatStatus) {
      // When all repeat is enabled, just re-enqueue nowplaying track and play next track
      case KafuuRepeatMode.ALL:
        beforeTrack.repeated = true; // Set track info to repeated to true
        await this.queue.pushTrack(beforeTrack); // Add track to queue
        await this.playNextTrack(); // Play next track
        this.log.debug(
          `Successfully re-enqueued nowplaying to queue & invoke playNextTrack @ ${this.guildId}`
        );
        break;
      case KafuuRepeatMode.SINGLE:
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
  private async resumeNowPlaying(
    nowPlaying: KafuuAudioTrack,
    position: number
  ) {
    // Player track = null, DB nowplaying = exists
    const guildConfig = await this.client.databaseHelper.upsertAndFindGuild(
      this.guildId
    );
    if (nowPlaying.info.isStream) {
      this.log.debug(`Nowplaying is stream, skipping...`);
      return this.playNextTrack();
    }
    await this.playTrack(nowPlaying, guildConfig.volume, position);
    return nowPlaying;
  }

  @BreakOnDestroyed()
  private async playTrack(
    trackToPlay: KafuuAudioTrack,
    volume: number,
    position?: number
  ): Promise<Player> {
    this.log.debug(
      `Playing track with volume ${volume} ${
        position ? "with position " + position : ""
      }`
    );
    const format: ReusableFormatFunc =
      await this.audioMessage.getReusableFormatFunction();
    const playingMessage: string = position
      ? format(
          "RESUMED_PLAYING",
          formatTrack(trackToPlay, { streamString: format("LIVESTREAM") }),
          humanizeSeconds(position, true)
        )
      : trackToPlay.relatedTrack
      ? format(
          "PLAYING_NOW_RELATED",
          formatTrack(trackToPlay, { streamString: format("LIVESTREAM") })
        )
      : format(
          "PLAYING_NOW",
          formatTrack(trackToPlay, { streamString: format("LIVESTREAM") })
        );
    await this.audioMessage.sendMessage(playingMessage);
    await this.queue.setNowPlaying(trackToPlay);
    this.setVolumePercent(volume);
    return this.player.playTrack({
      track: trackToPlay.track,
      options: {
        startTime: position,
        noReplace: false,
      },
    });
  }

  @BreakOnDestroyed()
  public async skipTrack(to?: number): Promise<void | KafuuAudioTrack> {
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
