import { SlashCommandBuilder } from "@discordjs/builders";

import { BaseCommand, KafuuClient } from "@/structures";
import { TypeORMGuild } from "@/models/typeorm";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { volumeEmoji } from "@/utils/formatter";
import { format } from "@/locales";

export default class VolumeCommand extends BaseCommand {
  constructor(client: KafuuClient) {
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
      KafuuCommandCategory.MUSIC,
      [KafuuCommandPermission.EVERYONE],
      KafuuCommandFlags.NOTHING,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
    userPermissions,
  }: KafuuCommandContext): Promise<void> {
    const volume: number | null = interaction.options.getInteger("volume");
    if (!volume) {
      const guildConfig: TypeORMGuild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId
        );
      await interaction.reply({
        content: format(
          interaction.locale,
          "CURRENT_VOLUME",
          volumeEmoji(guildConfig.volume),
          guildConfig.volume.toString()
        ),
      });
      return;
    }

    if (volume && !userPermissions.includes(KafuuCommandPermission.DJ)) {
      await interaction.reply({
        content: format(interaction.locale, "MUSIC_DJ_FEATURE"),
      });
      return;
    }

    // Max Volume = 150
    if (volume > 150) {
      await interaction.reply(
        format(interaction.locale, "VOLUME_CANNOT_OVER_MAX")
      );
      return;
    } else if (volume < 0) {
      await interaction.reply(
        format(interaction.locale, "VOLUME_CANNOT_UNDER_LOW")
      );
      return;
    }
    const guildConfig: TypeORMGuild =
      await this.client.databaseHelper.upsertAndFindGuild(interaction.guildId, {
        volume,
      });
    try {
      this.client.audio
        .getPlayerDispatcherOrfail(interaction.guildId)
        .setVolumePercent(guildConfig.volume);
    } catch {}
    await interaction.reply({
      content: format(
        interaction.locale,
        "CHANGED_VOLUME",
        volumeEmoji(guildConfig.volume),
        guildConfig.volume.toString()
      ),
    });
  }
}
