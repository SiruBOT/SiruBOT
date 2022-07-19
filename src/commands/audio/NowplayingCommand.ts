import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../types";
import locale from "../../locales";
import { PlayerDispatcher } from "../../structures/audio/PlayerDispatcher";
import {
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { EMOJI_REFRESH } from "../../constant/MessageConstant";

export default class NowplayingCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("nowplaying")
      .setNameLocalizations({
        ko: "재생정보",
      })
      .setDescription("Show the now playing track")
      .setDescriptionLocalizations({
        ko: "현재 재생 중인 곡의 정보를 보여드려요.",
      });
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
      ["SendMessages", "EmbedLinks"]
    );
  }

  public async onCommandInteraction({
    interaction,
  }: ICommandContext): Promise<void> {
    const dispatcher: PlayerDispatcher = this.client.audio.getPlayerDispatcher(
      interaction.guildId
    );
    const actionRow: ActionRowBuilder<ButtonBuilder> =
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setEmoji(EMOJI_REFRESH)
          .setStyle(ButtonStyle.Secondary)
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

  public async onButtonInteraction() {
    throw new Error("Update button implementation");
  }
}
