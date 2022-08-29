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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  InteractionUpdateOptions,
  InteractionReplyOptions,
} from "discord.js";
import { EMOJI_REFRESH, EMOJI_STAR } from "../../constant/MessageConstant";

const commandRequirements = {
  audioNode: true,
  trackPlaying: true,
  voiceStatus: {
    listenStatus: false,
    sameChannel: false,
    voiceConnected: false,
  },
} as const;
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
      commandRequirements,
      ["SendMessages", "EmbedLinks"]
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: ICommandContext<typeof commandRequirements>): Promise<void> {
    await interaction.reply(
      await this.getNowplayingPayload(
        interaction.guildId,
        interaction.locale,
        this.client.audio.dispatchers.get(interaction.guildId)
      )
    );
  }

  public override async onButtonInteraction(interaction: ButtonInteraction) {
    if (!interaction.guild || !interaction.guildId) return;
    switch (interaction.customId) {
      case "np_refresh":
        await interaction.update(
          await this.getNowplayingPayload(
            interaction.guildId,
            interaction.locale,
            this.client.audio.dispatchers.get(interaction.guildId)
          )
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
          .setCustomId(this.getCustomId("np_refresh")),
        new ButtonBuilder()
          .setEmoji(EMOJI_STAR)
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(this.getCustomId("np_favorite"))
      );
    return actionRow;
  }

  private async getNowplayingPayload(
    guildId: string,
    localeName: string,
    dispatcher?: PlayerDispatcher
  ): Promise<InteractionUpdateOptions & InteractionReplyOptions> {
    return {
      components: [this.buildActionRow()],
      content: dispatcher
        ? locale.format(
            localeName,
            "NOWPLAYING_TITLE",
            dispatcher.player.connection.channelId ?? "0"
          )
        : "",
      embeds: [await this.client.audio.getNowPlayingEmbed(guildId, localeName)],
      fetchReply: true,
    };
  }
}
