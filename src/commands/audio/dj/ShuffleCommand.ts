import { SlashCommandBuilder } from "discord.js";

import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { SYSTEM_MESSAGE_EPHEMERAL } from "@/constants/events/InteractionCreateEvent";
import { COMMAND_WARN_MESSAGE_EPHEMERAL } from "@/constants/events/InteractionCreateEvent";
import { format } from "@/locales";

export default class SeekCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("shuffle")
      .setNameLocalizations({
        ko: "셔플",
      })
      .setDescription("Shuffles the queue.")
      .setDescriptionLocalizations({
        ko: "재생 목록을 무작위로 섞어요.",
      });
    super({
      slashCommand,
      client,
      category: KafuuCommandCategory.MUSIC,
      permissions: [KafuuCommandPermission.DJ],
      requirements:
        KafuuCommandFlags.AUDIO_NODE | KafuuCommandFlags.TRACK_PLAYING,
      botPermissions: ["SendMessages"],
    });
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext<true>): Promise<void> {
    const { queue } = await this.client.audio.getPlayerDispatcherOrfail(
      interaction.guildId,
    );
    if ((await queue.getTracks()).length <= 0) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "SHUFFLE_NO_TRACKS"),
      });
      return;
    }

    const shuffledTracksCount = await queue.shuffleTrack();
    await interaction.reply({
      ephemeral: SYSTEM_MESSAGE_EPHEMERAL,
      content: format(
        interaction.locale,
        "SHUFFLE_SHUFFLED_TRACKS",
        shuffledTracksCount.toString(),
      ),
    });
  }
}
