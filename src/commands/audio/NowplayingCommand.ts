import { BaseCommand, KafuuClient } from "@/structures";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionUpdateOptions,
  InteractionReplyOptions,
  Locale,
  SlashCommandBuilder,
} from "discord.js";
import { EMOJI_REFRESH, EMOJI_STAR } from "@/constants/message";
import {
  KafuuButtonContext,
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";

export default class NowplayingCommand extends BaseCommand {
  constructor(client: KafuuClient) {
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
      KafuuCommandCategory.MUSIC,
      [KafuuCommandPermission.EVERYONE],
      KafuuCommandFlags.TRACK_PLAYING | KafuuCommandFlags.AUDIO_NODE,
      ["SendMessages", "EmbedLinks"],
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    await interaction.reply(
      await this.getNowplayingPayload(interaction.guildId, interaction.locale),
    );
  }

  public override async onButtonInteraction({
    interaction,
    customInfo: { customId },
  }: KafuuButtonContext) {
    if (!interaction.guild || !interaction.guildId) return;
    switch (customId) {
      case "np_refresh":
        await interaction.update(
          await this.getNowplayingPayload(
            interaction.guildId,
            interaction.locale,
          ),
        );
        break;
      case "np_favorite":
        // TODO: Playlist Command
        await interaction.reply("Will add to favorite");
        break;
    }
  }

  private buildActionRow(): ActionRowBuilder<ButtonBuilder> {
    const actionRow: ActionRowBuilder<ButtonBuilder> =
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setEmoji(EMOJI_REFRESH)
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(this.getCustomId({ customId: "np_refresh" })),
        new ButtonBuilder()
          .setEmoji(EMOJI_STAR)
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(this.getCustomId({ customId: "np_favorite" })),
      );
    return actionRow;
  }

  private async getNowplayingPayload(
    guildId: string,
    localeName: string,
  ): Promise<InteractionUpdateOptions & InteractionReplyOptions> {
    return {
      components: [this.buildActionRow()],
      embeds: [
        await this.client.audio.getNowPlayingEmbed(
          guildId,
          localeName as Locale,
        ),
      ],
      fetchReply: true,
    };
  }
}
