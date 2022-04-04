import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
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
          .addChoice("Off", "0")
          .addChoice("All", "1")
          .addChoice("Single", "2");
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
      ["SEND_MESSAGES"]
    );
  }

  public async runCommand({
    interaction,
    userPermissions,
  }: ICommandContext): Promise<void> {
    const repeatMode: string | null =
      interaction.options.getString("repeat_mode");
    if (!repeatMode || !userPermissions.includes(CommandPermissions.DJ)) {
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId
        );
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "REPEAT_STATE",
          EMOJI_REPEAT[guildConfig.repeat], // EMOJI_REPEAT => OFF: "EMOJI", RepeatModeString => (number like string): "OFF"
          locale.format(
            interaction.locale,
            "REPEAT_" + guildConfig.repeat.toString()
          )
        ),
      });
      return;
    } else {
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
          { repeat: parseInt(repeatMode) }
        );
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "REPEAT_SET",
          EMOJI_REPEAT[guildConfig.repeat],
          locale.format(
            interaction.locale,
            "REPEAT_" + guildConfig.repeat.toString()
          )
        ),
      });
    }
  }
}
