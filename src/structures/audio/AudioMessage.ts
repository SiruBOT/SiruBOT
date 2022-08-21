import { MessagePayload, Message, Channel } from "discord.js";
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
  private lastMessageId: string | undefined;
  private databaseHelper: DatabaseHelper;
  public nowplayingMessage?: Message<true>;
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
      name: log.settings.name + "/AudioMessage",
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

  public async sendMessage(options: string | MessagePayload): Promise<void> {
    this.log.debug(`Send audio message to guild ${this.guildId}...`);
    const { textChannelId, sendAudioMessages }: Guild =
      await this.databaseHelper.upsertAndFindGuild(this.guildId);
    if (!sendAudioMessages) {
      this.log.warn(
        `Guild ${this.guildId} disabled audio messages, ignoreing...`
      );
      return;
    }
    let targetChannel: Channel | null = null;
    if (textChannelId) {
      targetChannel = await this.fetchChannel(textChannelId);
    } else {
      targetChannel = await this.fetchChannel(this.channelId);
    }
    if (!targetChannel || !targetChannel.isTextBased()) {
      this.log.warn(`Target channel not found ${this.channelId}`);
      return;
    }
    const lastMessage: Message | undefined = (
      await targetChannel.messages.fetch({
        limit: 1,
      })
    ).first();
    if (
      lastMessage &&
      lastMessage.id == this.lastMessageId &&
      lastMessage.editable
    ) {
      try {
        this.log.debug(
          `Trying to edit message ${targetChannel.id}#${
            lastMessage?.id ?? "Unknown"
          }...`
        );
        await lastMessage.edit(options);
      } catch (e) {
        this.log.error(
          `Failed to edit message ${targetChannel.id}#${
            lastMessage?.id ?? "Unknown"
          } is message is deleted?`,
          e
        );
        Sentry.captureException(e);
        this.log.debug(
          `Failed to edit message ${targetChannel.id}#${
            lastMessage?.id ?? "Unknown"
          } trying to send message`
        );
        const lastMsg: Message = await targetChannel.send(options);
        this.lastMessageId = lastMsg.id;
      }
    } else {
      if (this.lastMessageId)
        await targetChannel.messages.delete(this.lastMessageId).catch(); // Ignore errors
      this.log.debug(`Send message to ${targetChannel.id}`);
      const lastMsg: Message = await targetChannel.send(options);
      this.lastMessageId = lastMsg.id;
    }
  }

  private async fetchChannel(channelId: string): Promise<Channel | null> {
    try {
      return await this.client.channels.fetch(channelId);
    } catch (e) {
      this.log.error(
        `Failed to fetch channel (${channelId}), is channel is deleted?`,
        e
      );
      Sentry.captureException(e);
      return null;
    }
  }
}
