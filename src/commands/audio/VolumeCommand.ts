import { SlashCommandBuilder } from "@discordjs/builders";
import { Guild } from "../../database/mysql/entities";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../types";
import { Formatter } from "../../utils";
import locale from "../../locales";
import { CommandPermissionError } from "../../structures/errors/CommandPermissionError";
export default class VolumeCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("volume")
      .setDescription("볼륨을 설정하거나 볼 수 있어요")
      .addIntegerOption((option) => {
        return option
          .setName("volume")
          .setDescription("볼륨 (1~150)")
          .setRequired(false);
      });
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
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
    const volume: number | null = interaction.options.getInteger("volume");
    if (!volume) {
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId
        );
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "CURRENT_VOLUME",
          Formatter.volumeEmoji(guildConfig.volume),
          guildConfig.volume.toString()
        ),
      });
      return;
    } else {
      if (!userPermissions.includes(CommandPermissions.DJ))
        throw new CommandPermissionError(CommandPermissions.DJ);
      // Max Volume = 150
      if (volume > 150) {
        return await interaction.reply({
          content: locale.format(interaction.locale, "VOLUME_CANNOT_OVER_MAX"),
        });
      } else if (volume < 0) {
        return await interaction.reply({
          content: locale.format(interaction.locale, "VOLUME_CANNOT_UNDER_LOW"),
        });
      }
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
          { volume }
        );
      try {
        this.client.audio
          .getPlayerDispatcher(interaction.guildId)
          .setVolumePercent(guildConfig.volume);
      } catch {}
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "CHANGED_VOLUME",
          Formatter.volumeEmoji(guildConfig.volume),
          guildConfig.volume.toString()
        ),
      });
    }
  }
}
