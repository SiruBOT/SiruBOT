import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../../structures";
import {
  CommandCategories,
  CommandPermissions,
  HandledCommandInteraction,
  RepeatMode,
  RepeatModeString,
} from "../../../types";
import locale from "../../../locales";
import { Guild } from "../../../database/mysql/entities";
import { EMOJI_REPEAT } from "../../../constant/Constants";

export default class RepeatCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("repeat")
      .setDescription("반복 기능을 설정해요")
      .addStringOption((option) => {
        option
          .setName("repeat_mode")
          .setDescription("Repeat mode")
          .addChoice("Single", "SINGLE")
          .addChoice("All", "ALL")
          .addChoice("Off", "OFF");
        return option;
      });
    super(
      slashCommand,
      client,
      CommandCategories.GENERAL,
      [CommandPermissions.DJ],
      {
        audioNode: false,
        trackPlaying: false,
        guildPermissions: ["SEND_MESSAGES"],
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceConnected: false,
        },
      }
    );
  }

  public async runCommand(
    interaction: HandledCommandInteraction
  ): Promise<void> {
    const repeatMode: string | null =
      interaction.options.getString("repeat_mode");
    if (!repeatMode) {
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId
        );
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "REPEAT_STATE",
          EMOJI_REPEAT[RepeatModeString[guildConfig.repeat]], // EMOJI_REPEAT => OFF: "EMOJI", RepeatModeString => (number like string): "OFF"
          locale.format(
            interaction.locale,
            "REPEAT_" + RepeatModeString[guildConfig.repeat]
          )
        ),
      });
      return;
    } else {
      const toSet: RepeatMode =
        repeatMode === RepeatModeString[RepeatMode.ALL]
          ? RepeatMode.ALL
          : repeatMode === RepeatModeString[RepeatMode.SINGLE]
          ? RepeatMode.SINGLE
          : RepeatMode.OFF;
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
          { repeat: toSet }
        );
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "REPEAT_SET",
          EMOJI_REPEAT[RepeatModeString[guildConfig.repeat]], // EMOJI_REPEAT => OFF: "EMOJI", RepeatModeString => (number like string): "OFF"
          locale.format(
            interaction.locale,
            "REPEAT_" + RepeatModeString[guildConfig.repeat]
          )
        ),
      });
    }
  }
}
