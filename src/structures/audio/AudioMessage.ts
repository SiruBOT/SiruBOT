import { AnyChannel, MessageOptions, MessagePayload } from "discord.js";
import { Logger } from "tslog";
import { Client, DatabaseHelper } from "..";
import { Guild } from "../../database/mysql/entities";
import { ReusableFormatFunction } from "../../locales/LocalePicker";
import * as Sentry from "@sentry/node";
import locale from "../../locales";

export class AudioMessage {
  private client: Client;
  private guildId: string;
  private channelId: string;
  private databaseHelper: DatabaseHelper;
  private log: Logger;
  constructor(
    client: Client,
    guildId: string,
    channelId: string,
    databaseHelper: DatabaseHelper,
    log: Logger
  ) {
    this.client = client;
    this.guildId = guildId;
    this.channelId = channelId;
    this.databaseHelper = databaseHelper;
    this.log = log.getChildLogger({
      name: log.settings.name + "AudioMessage",
    });
  }

  public async format(key: string, ...args: string[]): Promise<string> {
    this.log.debug(`Format key ${key} with guild config ${this.guildId}`);
    const guildConfig: Guild = await this.databaseHelper.upsertAndFindGuild(
      this.guildId
    );
    return locale.format(guildConfig.guildLocale, key, ...args);
  }

  public async getReusableFormatFunction(): Promise<ReusableFormatFunction> {
    this.log.debug(
      `Get reusable format function (for reduce db query) ${this.guildId}`
    );
    const guildConfig: Guild = await this.databaseHelper.upsertAndFindGuild(
      this.guildId
    );
    return locale.getReusableFormatFunction(guildConfig.guildLocale);
  }

  public async sendMessage(
    options: string | MessagePayload | MessageOptions
  ): Promise<void> {
    const channel: AnyChannel | null = await this.client.channels.fetch(
      this.channelId
    );
    if (channel?.isText()) {
      try {
        await channel.send(options);
      } catch (error) {
        Sentry.captureException(error);
        this.log.warn(
          `Failed to send audioMessage to ${this.channelId}`,
          error
        );
      }
    } else {
      throw new Error("Channel is not textChannel");
    }
  }
}
