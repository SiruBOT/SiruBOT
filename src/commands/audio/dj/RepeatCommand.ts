import { SlashCommandBuilder } from "discord.js";

import { BaseCommand, KafuuClient } from "@/structures";
import { TypeORMGuild } from "@/models/typeorm";

import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { EMOJI_REPEAT } from "@/constants/message";
import { format } from "@/locales";
import { STRING_KEYS } from "@/types/locales";

export default class RepeatCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("repeat")
      .setNameLocalizations({
        ko: "반복",
      })
      .setDescription("Sets the repeat mode")
      .setDescriptionLocalizations({
        ko: "반복 모드를 설정해요",
      })
      .addStringOption((option) => {
        option
          .setName("repeat_mode")
          .setNameLocalizations({
            ko: "모드",
          })
          .setDescription("Repeat mode to set")
          .setDescriptionLocalizations({
            ko: "설정할 반복 모드",
          })
          .addChoices(
            {
              name: "Off",
              value: "0",
              name_localizations: {
                ko: "끄기",
              },
            },
            {
              name: "All",
              value: "1",
              name_localizations: {
                ko: "전체",
              },
            },
            {
              name: "One",
              value: "2",
              name_localizations: {
                ko: "한곡",
              },
            },
          );
        return option;
      });
    super({
      slashCommand,
      client,
      category: KafuuCommandCategory.MUSIC,
      permissions: [KafuuCommandPermission.DJ],
      requirements: KafuuCommandFlags.NOTHING,
      botPermissions: ["SendMessages"],
    });
  }

  public override async onCommandInteraction({
    interaction,
    userPermissions,
  }: KafuuCommandContext): Promise<void> {
    const repeatMode: string | null =
      interaction.options.getString("repeat_mode");
    if (!repeatMode || !userPermissions.includes(KafuuCommandPermission.DJ)) {
      const guildConfig: TypeORMGuild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
        );
      await interaction.reply({
        content: format(
          interaction.locale,
          "REPEAT_STATE",
          EMOJI_REPEAT[guildConfig.repeat], // EMOJI_REPEAT => OFF: "EMOJI", RepeatModeString => (number like string): "OFF"
          format(
            interaction.locale,
            ("REPEAT_" + guildConfig.repeat.toString()) as STRING_KEYS,
          ),
        ),
      });
      return;
    } else {
      const guildConfig: TypeORMGuild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
          { repeat: parseInt(repeatMode) },
        );
      await interaction.reply({
        content: format(
          interaction.locale,
          "REPEAT_SET",
          EMOJI_REPEAT[guildConfig.repeat],
          format(
            interaction.locale,
            ("REPEAT_" + guildConfig.repeat.toString()) as STRING_KEYS,
          ),
        ),
      });
    }
  }
}
