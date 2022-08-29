import { createConnection, Connection, Repository } from "typeorm";
import { UpdateQuery, connect } from "mongoose";
import { Logger } from "tslog";
import { Client } from ".";
import entities, { Guild, Metrics } from "../database/mysql/entities";
import { GuildAudioDataModel } from "../database/mongodb/models";
import { IGuildAudioData } from "../types";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

interface StatsMetricsArgs {
  playingPlayers: number;
  shardGuildCount: number;
  websocketPing: number;
  shardIds: number[];
  clusterId: number;
}

export class DatabaseHelper {
  private log: Logger;
  protected client: Client;
  public mysqlConn: Connection;
  public mongoose: typeof import("mongoose") | undefined;
  constructor(client: Client) {
    this.client = client;
    this.log = this.client.log.getChildLogger({
      name: this.client.log.settings.name,
    });
  }

  public async setup() {
    this.log.debug("Setup databases...");
    const mysqlConn: Connection = await createConnection({
      type: "mysql",
      entities,
      synchronize: true,
      ...this.client.settings.database.mysql,
      logging: this.client.bootStrapperArgs.debug,
    });
    this.mysqlConn = mysqlConn;

    const mongoose: typeof import("mongoose") = await connect(
      this.client.settings.database.mongodb.url,
      {
        user: this.client.settings.database.mongodb.username,
        pass: this.client.settings.database.mongodb.password,
      }
    );
    this.mongoose = mongoose;
  }

  public async upsertGuildAudioData(
    discordGuildId: string,
    query: UpdateQuery<IGuildAudioData> = {}
  ): Promise<IGuildAudioData> {
    this.log.debug(
      `Upsert GuildAudioData @ ${discordGuildId}`,
      Object.keys(query) ? query : "Empty query"
    );
    const guildAudioData: IGuildAudioData =
      await GuildAudioDataModel.findOneAndUpdate(
        {
          discordGuildId,
        },
        query,
        {
          new: true,
          upsert: true,
        }
      ); // combine filter & update, new = data of after update
    return guildAudioData;
  }

  public async upsertAndFindGuild(
    discordGuildId: string,
    data: QueryDeepPartialEntity<Guild> = {}
  ): Promise<Guild> {
    this.log.debug(
      `Upsert Guild @ ${discordGuildId}`,
      Object.keys(data) ? data : "Empty data"
    );
    const guildRepository: Repository<Guild> =
      this.mysqlConn.getRepository(Guild);
    await guildRepository.upsert(
      {
        discordGuildId,
        ...data,
      },
      {
        conflictPaths: ["discordGuildId"],
      }
    );
    const returnResult = await guildRepository.findOneOrFail({
      discordGuildId,
    });
    return returnResult;
  }

  public async insertMetrics(options: StatsMetricsArgs) {
    const {
      clusterId,
      playingPlayers,
      shardGuildCount,
      websocketPing,
      shardIds,
    } = options;
    this.log.debug(`Insert metrics data @ ${clusterId}/${playingPlayers}`);
    const metricsRepository: Repository<Metrics> =
      this.mysqlConn.getRepository(Metrics);
    await metricsRepository.insert({
      clusterId,
      playingPlayers,
      shardGuildCount,
      websocketPing,
      shardIds,
    });
  }
}
