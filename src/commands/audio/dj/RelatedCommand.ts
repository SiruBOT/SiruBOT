import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../../structures";
import {
  CommandCategories,
  CommandPermissions,
  HandledCommandInteraction,
} from "../../../types";
import locale from "../../../locales";
import { Guild } from "../../../database/mysql/entities";

export default class RepeatCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("related")
      .setDescription("추천 영상 재생 기능을 설정해요")
      .addStringOption((option) => {
        option
          .setName("related_mode")
          .setDescription("Related playing mode")
          .addChoice("On", "ON")
          .addChoice("Off", "OFF");
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

  public async runCommand(
    interaction: HandledCommandInteraction
  ): Promise<void> {
    const relatedMode: string | null =
      interaction.options.getString("related_mode");
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
