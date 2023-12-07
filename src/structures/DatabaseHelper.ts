import { DataSource, Repository } from "typeorm";
import { UpdateQuery, connect } from "mongoose";
import { Logger } from "tslog";

import { KafuuClient } from "@/structures/KafuuClient";
import { GuildAudioDataModel } from "@/models/mongoose";
import { GuildAudioData } from "@/types/models/audio";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import entities, { TypeORMGuild, TypeORMMetrics } from "@/models/typeorm";

interface StatsMetricsArgs {
  playingPlayers: number;
  shardGuildCount: number;
  websocketPing: number;
  shardIds: number[];
  clusterId: number;
}

export class DatabaseHelper {
  private log: Logger;
  protected client: KafuuClient;
  public mySqlDataSource: DataSource;
  public mongoose: typeof import("mongoose") | undefined;

  constructor(client: KafuuClient) {
    this.client = client;
    this.log = this.client.log.getChildLogger({
      name: client.log.settings.name + "-" + DatabaseHelper.name,
    });
  }

  public async setup() {
    this.log.debug("Setup databases...");
    this.mySqlDataSource = new DataSource({
      type: "mysql",
      entities,
      ...this.client.settings.database.mysql,
      logging: this.client.bootStrapperArgs.debug,
      synchronize: process.env.NODE_ENV === "production" ? false : true,
    });
    await this.mySqlDataSource.initialize();

    const mongoose: typeof import("mongoose") = await connect(
      this.client.settings.database.mongodb.url,
      {
        user: this.client.settings.database.mongodb.username,
        pass: this.client.settings.database.mongodb.password,
      },
    );
    this.mongoose = mongoose;

    if (!this.isReady)
      throw new Error(
        "Database initialize failed. please check your settings.",
      );
  }

  get isReady() {
    return (
      this.mySqlDataSource.isInitialized &&
      this.mongoose &&
      this.mongoose.connection.readyState == 1
    );
  }

  public async upsertGuildAudioData(
    discordGuildId: string,
    query: UpdateQuery<GuildAudioData> = {},
  ): Promise<GuildAudioData> {
    if (!this.isReady) throw new Error("DatabaseHelper is not ready.");
    this.log.debug(
      `Upsert GuildAudioData @ ${discordGuildId}`,
      Object.keys(query) ? query : "Empty query",
    );
    const guildAudioData: GuildAudioData =
      await GuildAudioDataModel.findOneAndUpdate(
        {
          discordGuildId,
        },
        query,
        {
          new: true,
          upsert: true,
        },
      ); // combine filter & update, new = data of after update
    return guildAudioData;
  }

  public async upsertAndFindGuild(
    discordGuildId: string,
    data: QueryDeepPartialEntity<TypeORMGuild> = {},
  ): Promise<TypeORMGuild> {
    if (!this.isReady) throw new Error("DatabaseHelper is not ready.");
    this.log.debug(
      `Upsert Guild @ ${discordGuildId}`,
      Object.keys(data) ? data : "Empty data",
    );
    const guildRepository: Repository<TypeORMGuild> =
      this.mySqlDataSource.getRepository(TypeORMGuild);
    await guildRepository.upsert(
      {
        discordGuildId,
        ...data,
      },
      {
        conflictPaths: ["discordGuildId"],
      },
    );
    const returnResult = await guildRepository.findOneOrFail({
      where: {
        discordGuildId,
      },
    });
    return returnResult;
  }

  public async insertMetrics(options: StatsMetricsArgs) {
    if (!this.isReady) throw new Error("DatabaseHelper is not ready.");
    const {
      clusterId,
      playingPlayers,
      shardGuildCount,
      websocketPing,
      shardIds,
    } = options;
    this.log.debug(`Insert metrics data @ ${clusterId}/${playingPlayers}`);
    const metricsRepository: Repository<TypeORMMetrics> =
      this.mySqlDataSource.getRepository(TypeORMMetrics);
    await metricsRepository.insert({
      clusterId,
      playingPlayers,
      shardGuildCount,
      websocketPing,
      shardIds,
    });
  }
}
