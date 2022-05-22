import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../types";
import locale from "../../locales";
import { PlayerDispatcher } from "../../structures/audio/PlayerDispatcher";
import { Message, MessageActionRow, MessageButton } from "discord.js";
import { EMOJI_REFRESH } from "../../constant/MessageConstant";

export default class NowplayingCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("nowplaying")
      .setDescription("현재 재생 중인 곡의 정보를 보여드려요");
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
      {
        audioNode: true,
        trackPlaying: true,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceConnected: false,
        },
      },
      ["SEND_MESSAGES", "EMBED_LINKS"]
    );
  }

  public async runCommand({ interaction }: ICommandContext): Promise<void> {
    const dispatcher: PlayerDispatcher = this.client.audio.getPlayerDispatcher(
      interaction.guildId
    );
    const actionRow: MessageActionRow = new MessageActionRow();
    actionRow.addComponents(
      new MessageButton()
        .setEmoji(EMOJI_REFRESH)
        .setStyle("SECONDARY")
        .setCustomId("np_refresh")
    );
    const nowplayingMessage: Message<true> = await interaction.reply({
      components: [actionRow],
      content: locale.format(
        interaction.locale,
        "NOWPLAYING_TITLE",
        dispatcher.player.connection.channelId ?? "N/A"
      ),
      embeds: [
        await this.client.audio.getNowPlayingEmbed(
          interaction.guildId,
          interaction.locale
        ),
      ],
      fetchReply: true,
    });
    dispatcher.audioMessage.nowplayingMessage = nowplayingMessage;
  }
}
