import { SlashCommandBuilder } from "discord.js";
import { BaseCommand, KafuuClient } from "@/structures";
import { PlayerDispatcher } from "@/structures/audio";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { format } from "@/locales";

export default class StopCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("stop")
      .setNameLocalizations({
        ko: "정지",
      })
      .setDescription("Stops the player and clean up guild queue.")
      .setDescriptionLocalizations({
        ko: "재생 중인 노래를 정지하고 대기열을 초기화해요.",
      });
    super({
      slashCommand,
      client,
      category: KafuuCommandCategory.MUSIC,
      permissions: [KafuuCommandPermission.DJ],
      requirements:
        KafuuCommandFlags.TRACK_PLAYING | KafuuCommandFlags.AUDIO_NODE,
      botPermissions: ["SendMessages"],
    });
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    const dispatcher: PlayerDispatcher =
      this.client.audio.getPlayerDispatcherOrfail(interaction.guildId);
    await interaction.reply({
      content: format(interaction.locale, "CLEANED_AND_STOPPED"),
    });
    await dispatcher.cleanStop();
  }
}
