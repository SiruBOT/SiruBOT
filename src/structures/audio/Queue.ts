import { Logger } from "tslog";

import { KafuuAudioTrack } from "@/types/audio";
import { GuildAudioData } from "@/types/models/audio";
import { DatabaseHelper } from "@/structures";
import { VoteSkip } from "@/structures/audio";

export class Queue {
  private log: Logger;
  private databaseHelper: DatabaseHelper;
  private guildId: string;
  public voteSkip: VoteSkip;

  constructor(guildId: string, databaseHelper: DatabaseHelper, log: Logger) {
    this.log = log.getChildLogger({ name: log.settings.name });
    this.guildId = guildId;
    this.databaseHelper = databaseHelper;
    this.voteSkip = new VoteSkip();
  }

  public async cleanQueue(): Promise<GuildAudioData> {
    this.log.debug(`Clean the queue @ ${this.guildId}`);
    const cleanedData = await this.databaseHelper.upsertGuildAudioData(
      this.guildId,
      { $set: { queue: [], nowPlaying: null, position: null } }
    );
    return cleanedData;
  }

  public async getQueue(): Promise<KafuuAudioTrack[]> {
    this.log.debug(`Get queue from ${this.guildId}`);
    const { queue }: { queue: KafuuAudioTrack[] } =
      await this.databaseHelper.upsertGuildAudioData(this.guildId);
    return queue;
  }

  public async pushTrack(track: KafuuAudioTrack): Promise<KafuuAudioTrack> {
    this.log.debug(`Push track ${track.info.identifier} @ ${this.guildId}`);
    await this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $push: { queue: track },
    });
    return track;
  }

  public async pushTracks(tracks: KafuuAudioTrack[]): Promise<number> {
    this.log.debug(`Push ${tracks.length} tracks to ${this.guildId}`);
    await this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $push: { queue: { $each: tracks } },
    });
    return tracks.length;
  }

  public async unshiftTrack(track: KafuuAudioTrack): Promise<KafuuAudioTrack> {
    this.log.debug(
      `Push track ${track.info.identifier} with position 0 @ ${this.guildId}`
    );
    await this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $push: { queue: { $each: [track], $position: 0 } },
    });
    return track;
  }

  public async shiftTrack(): Promise<KafuuAudioTrack | null> {
    const beforeShift = await this.databaseHelper.upsertGuildAudioData(
      this.guildId
    );
    this.voteSkip.clearSkippers(); // 한곡이 끝날때마다 shiftTrack이 되기 때문에 스킵 유저 초기화를 여기에서 처리해주면 됨
    // BeforeShift = shifted track
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

  public async setNowPlaying(
    track: KafuuAudioTrack
  ): Promise<KafuuAudioTrack | null> {
    this.log.debug(`Set nowplaying @ ${this.guildId}`);
    const updated = await this.databaseHelper.upsertGuildAudioData(
      this.guildId,
      { $set: { nowPlaying: track } }
    );
    return updated.nowPlaying;
  }

  public async getNowPlaying(): Promise<KafuuAudioTrack | null> {
    this.log.debug(`Get nowplaying from ${this.guildId}`);
    const { nowPlaying }: { nowPlaying: KafuuAudioTrack | null } =
      await this.databaseHelper.upsertGuildAudioData(this.guildId);
    return nowPlaying;
  }

  // https://stackoverflow.com/questions/69070811/pop-many-first-n-items-in-mongo-db
  public async skipTo(to: number) {
    this.log.debug(`Slice queue tracks @ ${this.guildId} ${to}`);
    await this.databaseHelper.upsertGuildAudioData(this.guildId, [
      {
        $set: {
          queue: {
            $filter: {
              input: "$queue",
              as: "z",
              cond: {
                $gte: [
                  {
                    $indexOfArray: ["$queue", "$$z"],
                  },
                  to, // 5 is n first item
                ],
              },
            },
          },
        },
      },
    ]);
  }

  public async setPosition(position: number | null): Promise<GuildAudioData> {
    this.log.debug(`Update position to ${position} @ ${this.guildId}`);
    return await this.databaseHelper.upsertGuildAudioData(this.guildId, {
      $set: {
        position: position,
        positionUpdatedAt: new Date(),
      },
    });
  }

  public async getGuildAudioData(): Promise<GuildAudioData> {
    this.log.debug(`Get guildAudioData from ${this.guildId}`);
    const guildAudioData: GuildAudioData =
      await this.databaseHelper.upsertGuildAudioData(this.guildId);
    return guildAudioData;
  }
}
