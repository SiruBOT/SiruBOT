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
      .setNameLocalizations({
        ko: "볼륨",
      })
      .setDescription("Set or view the volume of the player")
      .setDescriptionLocalizations({
        ko: "플레이어의 볼륨을 설정하거나 보실 수 있어요.",
      })
      .addIntegerOption((option) => {
        return option
          .setName("volume")
          .setNameLocalizations({
            ko: "볼륨",
          })
          .setDescription("Volume (min: 1%, max: 150%)")
          .setDescriptionLocalizations({
            ko: "볼륨 (1~150%)",
          })
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
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
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
        await interaction.reply(
          locale.format(interaction.locale, "VOLUME_CANNOT_OVER_MAX")
        );
        return;
      } else if (volume < 0) {
        await interaction.reply(
          locale.format(interaction.locale, "VOLUME_CANNOT_UNDER_LOW")
        );
        return;
      }
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
          { volume }
        );
      try {
        this.client.audio
          .getPlayerDispatcherOrfail(interaction.guildId)
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
