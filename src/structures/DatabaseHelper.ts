import { createConnection, Connection, Repository } from "typeorm";
import { UpdateQuery, connect } from "mongoose";
import { Logger } from "tslog";

import { Client } from ".";
import { User, Guild } from "../database/mysql/entities";
import { GuildAudioDataModel } from "../database/mongodb/models";
import { IGuildAudioData } from "../types";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
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
      entities: [Guild, User],
      synchronize: true,
      ...this.client.settings.database.mysql,
      logging: true,
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

  async upsertGuildAudioData(
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

  async upsertAndFindGuild(
    discordGuildId: string,
    data: QueryDeepPartialEntity<Guild> = {}
  ): Promise<Guild> {
    this.log.debug(
      `Upsert Guild @ ${discordGuildId}`,
      Object.keys(data) ? data : "Empty data"
    );
    const guildRepository: Repository<Guild> | undefined =
      this.mysqlConn.getRepository(Guild);
    await guildRepository.upsert(
      {
        discordGuildId,
        ...data,
      },
      ["discordGuildId"]
    );
    const returnResult = await guildRepository.findOneOrFail({
      discordGuildId,
    });
    return returnResult;
  }
}
