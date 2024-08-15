import { MessagePayload, Message, Channel } from "discord.js";
import { Logger } from "tslog";
import { KafuuClient } from "@/structures";
import { TypeORMGuild } from "@/models/typeorm";
import { getReusableFormatFunction } from "@/locales";
import { ReusableFormatFunc, STRING_KEYS } from "@/types/locales";

export class AudioMessage {
  private client: KafuuClient;
  private guildId: string;
  private channelId: string;
  private lastMessageId: string;
  private log: Logger;
  private cachedFormatFunction?: ReusableFormatFunc;
  public nowplayingMessage?: Message<true>;
  constructor(
    client: KafuuClient,
    guildId: string,
    channelId: string,
    log: Logger,
  ) {
    this.client = client;
    this.guildId = guildId;
    this.channelId = channelId;
    this.log = log.getChildLogger({
      name: log.settings.name + "-" + AudioMessage.name,
    });
  }

  public async format(key: STRING_KEYS, ...args: string[]): Promise<string> {
    if (!this.cachedFormatFunction) {
      this.log.debug(
        `Get reusable format function (for reduce db query) ${this.guildId}`,
      );
      const guildConfig: TypeORMGuild =
        await this.client.databaseHelper.upsertAndFindGuild(this.guildId);
      this.cachedFormatFunction = getReusableFormatFunction(
        guildConfig.guildLocale,
      );
    }
    return this.cachedFormatFunction(key, ...args);
  }

  private async sendMessage(options: string | MessagePayload): Promise<void> {
    this.log.debug(`Send audio message to guild ${this.guildId}...`);
    const { textChannelId, sendAudioMessages }: TypeORMGuild =
      await this.client.databaseHelper.upsertAndFindGuild(this.guildId);
    if (!sendAudioMessages) {
      this.log.warn(`Guild ${this.guildId} disabled audio messages, ignore...`);
      return;
    }
    const targetChannel: Channel | null = await this.fetchChannel(
      textChannelId ?? this.channelId,
    );
    if (!targetChannel || !targetChannel.isTextBased()) {
      this.log.warn(`Target channel not found ${this.channelId}`);
      return;
    }
    const lastMessage = (
      await targetChannel.messages.fetch({
        limit: 1,
      })
    ).first();
    // If last message is not null and audio message == last message and editable
    if (
      lastMessage &&
      lastMessage.id == this.lastMessageId &&
      lastMessage.editable
    ) {
      try {
        this.log.debug(
          `Trying to edit message ${targetChannel.id}#${
            lastMessage?.id ?? "Unknown"
          }...`,
        );
        await lastMessage.edit(options);
      } catch (e) {
        this.log.debug(
          `Failed to edit message ${targetChannel.id}#${
            lastMessage?.id ?? "Unknown"
          } trying to send message`,
        );
        const lastMsg: Message = await targetChannel.send(options);
        this.lastMessageId = lastMsg.id;
      }
    } else {
      try {
        if (this.lastMessageId)
          await targetChannel.messages.delete(this.lastMessageId);
      } catch (e) {
        this.log.debug(
          `Failed to delete message ${targetChannel.id}#${
            this.lastMessageId ?? "Unknown"
          } is message is deleted?`,
          e,
        );
      }
      this.log.debug(`Send message to ${targetChannel.id}`);
      const lastMsg: Message = await targetChannel.send(options);
      this.lastMessageId = lastMsg.id;
    }
  }

  public async sendErrorMessage(): Promise<void> {
    await this._formatSend("PLAYBACK_ERROR");
  }

  public async sendDisconnectedMessage(): Promise<void> {
    await this._formatSend("DISCONNECT_ERROR");
  }

  public async sendRelatedYoutubeOnly() {
    await this._formatSend("RELATED_ONLY_YOUTUBE");
  }

  public async sendRelatedFailed() {
    await this._formatSend("RELATED_FAILED");
  }

  public async sendRelatedScrapeFailed() {
    await this._formatSend("RELATED_SCRAPE_ERROR");
  }

  public async sendPlayEnded() {
    await this._formatSend("ENDED_PLAYBACK");
  }

  public async sendRaw(content: string) {
    await this.sendMessage(content);
  }

  private async _formatSend(key: STRING_KEYS, ...args: string[]) {
    await this.sendMessage(await this.format(key, ...args));
  }

  private async fetchChannel(channelId: string): Promise<Channel | null> {
    try {
      return await this.client.channels.fetch(channelId);
    } catch (e) {
      this.log.error(
        `Failed to fetch channel (${channelId}), is channel is deleted?`,
        e,
      );
      return null;
    }
  }
}
