import { createConnection, Connection } from "typeorm";
import {
  createConnection as createMongoConnection,
  Connection as MongoConnection,
} from "mongoose";
import { Logger } from "tslog";

import { Client } from ".";
import { User, Guild } from "../database/mysql/entities";
export class DatabaseHelper {
  private log: Logger;
  protected client: Client;
  public mysqlConn: Connection | undefined;
  public mongoConn: MongoConnection | undefined;
  constructor(client: Client) {
    this.client = client;
    this.log = client.log.getChildLogger({
      name: client.log.settings.name,
      prefix: ["DataBaseHelper"],
    });
  }

  public async setup() {
    this.log.debug("Setup databases...");
    const mysqlConn: Connection = await createConnection({
      type: "mysql",
      entities: [Guild, User],
      synchronize: true,
      ...this.client.settings.database.mysql,
    });
    this.mysqlConn = mysqlConn;

    // const mongoConn = await createMongoConnection(
    //   this.client.settings.database.mongodb.url
    // ).asPromise();
    // this.mongoConn = mongoConn;
  }
}
