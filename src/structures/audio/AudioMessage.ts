import {
  AnyChannel,
  MessageOptions,
  MessagePayload,
  Message,
} from "discord.js";
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
    this.log.debug(`Send audio message to guild ${this.guildId}...`);
    const { textChannelId, sendAudioMessages }: Guild =
      await this.databaseHelper.upsertAndFindGuild(this.guildId);
    if (!sendAudioMessages) return;
    let targetChannel: AnyChannel | null = null;
    if (textChannelId) {
      targetChannel = await this.fetchChannel(textChannelId);
    }
    if (!textChannelId || !targetChannel) {
      targetChannel = await this.fetchChannel(this.channelId);
    }
    if (targetChannel?.isText()) {
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
            `Trying to edit message ${targetChannel.id}#${targetChannel.lastMessage?.id}...`
          );
          await lastMessage.edit(options);
        } catch (e) {
          this.log.error(
            `Failed to edit message ${targetChannel.id}#${targetChannel.lastMessage?.id} is message is deleted?`,
            e
          );
          Sentry.captureException(e);
          this.log.debug(
            `Failed to edit message ${targetChannel.id}#${targetChannel.lastMessage?.id} trying to send message`
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
  }

  private async fetchChannel(channelId: string): Promise<AnyChannel | null> {
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
