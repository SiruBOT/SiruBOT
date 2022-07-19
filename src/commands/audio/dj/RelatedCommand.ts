import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../../types";
import locale from "../../../locales";
import { Guild } from "../../../database/mysql/entities";

export default class RepeatCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("related")
      .setNameLocalizations({
        ko: "추천곡재생",
      })
      .setDescription("Turn on/off related song playback")
      .setDescriptionLocalizations({
        ko: "추천 영상 재생을 설정해요",
      })
      .addStringOption((option) => {
        option
          .setName("status")
          .setNameLocalizations({
            ko: "상태",
          })
          .setDescription("Related playing mode")
          .setDescriptionLocalizations({
            ko: "추천 영상 재생 상태",
          })
          .addChoices(
            {
              name: "On",
              value: "ON",
              name_localizations: {
                ko: "켜기",
              },
            },
            {
              name: "Off",
              value: "OFF",
              name_localizations: {
                ko: "끄기",
              },
            }
          );
        return option;
      });
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.DJ],
      {
        audioNode: false,
        trackPlaying: false,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceConnected: false,
        },
      },
      ["SendMessages"]
    );
  }

  public async onCommandInteraction({
    interaction,
  }: ICommandContext): Promise<void> {
    const relatedMode: string | null = interaction.options.getString("status");
    if (!relatedMode) {
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId
        );
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "RELATED_MODE",
          locale.format(
            interaction.locale,
            guildConfig.playRelated ? "ON" : "OFF"
          )
        ),
      });
    } else {
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
          { playRelated: relatedMode === "ON" } // OFF = false
        );
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "RELATED_MODE_SET",
          locale.format(
            interaction.locale,
            guildConfig.playRelated ? "ON" : "OFF"
          )
        ),
      });
    }
  }
}
