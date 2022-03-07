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
import { MessageOptions } from "discord.js";
import { ReusableFormatFunction } from "../../locales/LocalePicker";
import { Formatter } from "../../utils";
import { EventEmitter } from "events";

export class PlayerDispatcher extends EventEmitter {
  public audio: AudioHandler;
  public client: Client;
  private player: ShoukakuPlayer;
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

  async onClosed(reason: WebSocketClosedEvent) {
    this.log.warn(
      `Websocket closed @ ${this.player.connection.guildId}`,
      reason || "No reason"
    );
    this.destroy();
    const friendlyErrorCodes = [4014];
    if (friendlyErrorCodes.includes(reason.code)) {
      await this.audioMessage.sendMessage(
        await this.audioMessage.format("DISCONNECT_ERROR")
      );
    }
  }

  async onUpdate(data: PlayerUpdate) {
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

  async onException(exception: TrackExceptionEvent) {
    this.log.error(`Error while playback`, exception);
    Sentry.captureException(exception);
  }

  async onEnd(trackEndEvent: TrackEndEvent) {
    this.log.debug(
      `Track ended, playing next item or handle repeat/related`,
      trackEndEvent.reason || "No reason"
    );
    switch (trackEndEvent.reason) {
      case "FINISHED":
        try {
          const guildConfig = await this.databaseHelper.upsertAndFindGuild(
            this.guildId
          );
          if (guildConfig.repeat !== RepeatMode.OFF) {
            this.log.debug(`Trying handle repeat ${guildConfig.repeat}`);
            await this.handleRepeat(guildConfig.repeat);
            return;
          } else if (
            guildConfig.repeat === RepeatMode.OFF &&
            guildConfig.playRelated
          ) {
            this.log.debug(`Trying handle related videos`);
            await this.playRelated();
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
    }
  }

  async addTracks(tracks: IAudioTrack[]): Promise<number> {
    this.log.debug(`Add tracks ${tracks.length}`);
    await this.queue.pushTracks(tracks);
    await this.playOrResumeOrNothing();
    return tracks.length;
  }

  async addTrack(track: IAudioTrack): Promise<IAudioTrack> {
    this.log.debug(`Add track ${track.shoukakuTrack.info.identifier}`);
    await this.queue.pushTrack(track);
    await this.playOrResumeOrNothing();
    return track;
  }

  // WTF is this method name
  async playOrResumeOrNothing(): Promise<IAudioTrack | void> {
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

  async playNextTrack(): Promise<IAudioTrack | void> {
    this.log.debug(`Playing next track`);
    const guildConfig = await this.databaseHelper.upsertAndFindGuild(
      this.guildId
    );
    const toPlay: IAudioTrack | null = await this.queue.shiftTrack();
    if (toPlay) {
      this.playTrack(toPlay, guildConfig.volume);
      return toPlay;
    } else {
      this.log.debug(`Nothing to playing next. Stop & clean PlayerDispatcher`);
      await this.stopPlayer();
      return;
    }
  }

  async playRelated(): Promise<void> {
    // Related track handle
    const beforeTrack: IAudioTrack | null = await this.queue.getNowPlaying();
    if (
      !beforeTrack ||
      beforeTrack.shoukakuTrack.info.sourceName !== "youtube"
    ) {
      // Youtube only message send & clean disconnect
      this.log.debug(
        "beforeTrack is not youtube video or beforeTrack is not exists. Stop & clean PlayerDispatcher"
      );
      // await this.audioMessage.sendMessage(this.audioMessage.format(""));
      this.cleanStop();
    } else {
      // Handle related
    }
  }

  async handleRepeat(repeatStatus: RepeatMode): Promise<void> {
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

  async resumeNowPlaying(nowPlaying: IAudioTrack) {
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
      (positionUpdatedAt.getTime() < 10
        ? 0
        : new Date().getTime() - positionUpdatedAt.getTime());
    this.log.debug(
      `Approximately Calculated nowplaying position: ${calculatedPos}`
    );
    this.audioMessage.sendMessage(
      `Approximately Calculated nowplaying position: ${calculatedPos}`
    );
    // this.log.debug(`Resume nowPlaying track with position ${position}`);
    // position + (current date to timestamp - guildAudioData.updatedAt) = Bot offline time
    await this.playTrack(nowPlaying, guildConfig.volume, calculatedPos);
    return nowPlaying;
  }

  async playTrack(
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
    const playingMessage: MessageOptions = position
      ? {
          content: format(
            "RESUMED_PLAYING",
            Formatter.formatTrack(
              toPlay.shoukakuTrack,
              format("LIVESTREAM"),
              true
            ),
            Formatter.humanizeSeconds(position / 1000)
          ),
        }
      : {
          content: format(
            "PLAYING_NOW",
            Formatter.formatTrack(
              toPlay.shoukakuTrack,
              format("LIVESTREAM"),
              true
            )
          ),
        };
    await this.audioMessage.sendMessage(playingMessage);
    await this.queue.setNowPlaying(toPlay);
    this.setVolumePercent(volume);
    return this.player.playTrack(toPlay.shoukakuTrack.track, {
      startTime: position,
      noReplace: false,
    });
  }

  async skipTrack(to: number | null = null): Promise<void | IAudioTrack> {
    if (!to) {
      this.log.debug("Skipped track");
      return await this.playNextTrack();
    } else {
      this.log.debug(`Skip to #${to}`);
      await this.queue.skipTo(to);
      return await this.playNextTrack();
    }
  }

  setVolumePercent(val: number): number {
    const calc = val / 100;
    this.log.debug(`Set player's volume to ${val}% (${calc})`);
    this.player.setVolume(calc);
    return val;
  }

  async stopPlayer(): Promise<void> {
    await this.cleanStop();
    // Send Audio Message
    await this.audioMessage.sendMessage({
      content: await this.audioMessage.format("ENDED_PLAYBACK"),
    });
  }

  async handleError(exceptionId: string): Promise<void> {
    this.destroy();
    await this.audioMessage.sendMessage({
      content: await this.audioMessage.format("PLAYBACK_ERROR", exceptionId),
    });
  }

  async pausePlayer(): Promise<void> {
    this.destroy();
    // Send Audio Message
  }

  async cleanStop() {
    this.log.debug(`Clean queue & destroy dispatcher`);
    await this.queue.cleanQueue();
    this.destroy();
  }

  destroy() {
    this.log.debug(`Destroy PlayerDispatcher.`);
    this.audio.deletePlayerDispatcher(this.guildId);
    this.player.connection.disconnect();
  }
}
