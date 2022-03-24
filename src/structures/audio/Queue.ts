import { IGuildAudioData, IAudioTrack } from "../../types";
import { Logger } from "tslog";
import { DatabaseHelper } from "..";

export class Queue {
  private log: Logger;
  private databaseHelper: DatabaseHelper;
  private guildId: string;

  constructor(guildId: string, databaseHelper: DatabaseHelper, log: Logger) {
    this.log = log.getChildLogger({ name: log.settings.name });
    this.guildId = guildId;
    this.databaseHelper = databaseHelper;
  }

  public async cleanQueue(): Promise<IGuildAudioData> {
    this.log.debug(`Clean the queue @ ${this.guildId}`);
    const cleanedData = await this.databaseHelper.upsertGuildAudioData(
      this.guildId,
      { $set: { queue: [], nowPlaying: null, position: null } }
    );
    return cleanedData;
  }

  public async getQueue(): Promise<IAudioTrack[]> {
    this.log.debug(`Get queue from ${this.guildId}`);
    const { queue }: { queue: IAudioTrack[] } =
      await this.databaseHelper.upsertGuildAudioData(this.guildId);
    return queue;
  }

  public async pushTrack(track: IAudioTrack): Promise<IAudioTrack> {
    this.log.debug(`Push track ${track.shoukakuTrack.info.identifier}`);
    await this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $push: { queue: track },
    });
    return track;
  }

  public async pushTracks(tracks: IAudioTrack[]): Promise<number> {
    this.log.debug(`Push ${tracks.length} tracks to ${this.guildId}`);
    await this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $push: { queue: { $each: tracks } },
    });
    return tracks.length;
  }

  public async unshiftTrack(track: IAudioTrack): Promise<IAudioTrack> {
    this.log.debug(
      `Push track ${track.shoukakuTrack.info.identifier} with position 0`
    );
    await this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $push: { queue: { $each: [track], $position: 0 } },
    });
    return track;
  }

  public async shiftTrack(): Promise<IAudioTrack | null> {
    const beforeShift = await this.databaseHelper.upsertGuildAudioData(
      this.guildId
    );
    if (!beforeShift.queue[0]) {
      this.log.debug(
        `Shift track from ${this.guildId} (Queue is empty. returning null)`
      );
      return null;
    }
    this.log.debug(`Shift track from ${this.guildId}`);
    await this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $pop: {
        queue: -1,
      },
    });
    return beforeShift.queue[0];
  }

  public async setNowPlaying(track: IAudioTrack): Promise<IAudioTrack | null> {
    this.log.debug(`Set nowplaying`);
    const updated = await this.databaseHelper.upsertGuildAudioData(
      this.guildId,
      { $set: { nowPlaying: track } }
    );
    return updated.nowPlaying;
  }

  public async getNowPlaying(): Promise<IAudioTrack | null> {
    this.log.debug(`Get nowplaying from ${this.guildId}`);
    const { nowPlaying }: { nowPlaying: IAudioTrack | null } =
      await this.databaseHelper.upsertGuildAudioData(this.guildId);
    return nowPlaying;
  }

  public async skipTo(to: number) {
    this.log.debug(`Slice queue to ${to} tracks`);
    this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $push: { queue: { $each: [], $slice: to } },
    });
  }

  public async setPosition(position: number | null): Promise<IGuildAudioData> {
    this.log.debug(`Update position to ${position}`);
    return await this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $set: {
        position: position,
        positionUpdatedAt: new Date(),
      },
    });
  }

  public async getGuildAudioData(): Promise<IGuildAudioData> {
    this.log.debug(`Get guildAudioData from ${this.guildId}`);
    const guildAudioData: IGuildAudioData =
      await this.databaseHelper.upsertGuildAudioData(this.guildId);
    return guildAudioData;
  }
}
