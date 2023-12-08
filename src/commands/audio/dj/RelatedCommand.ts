import { SlashCommandBuilder } from "discord.js";

import { BaseCommand, KafuuClient } from "@/structures";
import { TypeORMGuild } from "@/models/typeorm";
import { format } from "@/locales";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";

export default class RepeatCommand extends BaseCommand {
  constructor(client: KafuuClient) {
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
            },
          );
        return option;
      });
    super(
      slashCommand,
      client,
      KafuuCommandCategory.MUSIC,
      [KafuuCommandPermission.DJ],
      KafuuCommandFlags.NOTHING,
      ["SendMessages"],
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    const relatedMode: string | null = interaction.options.getString("status");
    if (!relatedMode) {
      const guildConfig: TypeORMGuild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
        );
      await interaction.reply({
        content: format(
          interaction.locale,
          "RELATED_MODE",
          format(interaction.locale, guildConfig.playRelated ? "ON" : "OFF"),
        ),
      });
    } else {
      const guildConfig: TypeORMGuild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
          { playRelated: relatedMode === "ON" }, // OFF = false
        );
      await interaction.reply({
        content: format(
          interaction.locale,
          "RELATED_MODE_SET",
          format(interaction.locale, guildConfig.playRelated ? "ON" : "OFF"),
        ),
      });
    }
  }
}
