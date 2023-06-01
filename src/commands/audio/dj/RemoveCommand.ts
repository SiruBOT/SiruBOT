import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { AutocompleteInteraction, SlashCommandBuilder } from "discord.js";

export class RemoveCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("remove")
      .setDescription("Remove a song from the queue.")
      .setNameLocalizations({
        ko: "삭제",
      })
      .setDescriptionLocalizations({
        ko: "대기열에서 노래를 삭제합니다.",
      });
    super(
      slashCommand,
      client,
      KafuuCommandCategory.MUSIC,
      [KafuuCommandPermission.DJ],
      KafuuCommandFlags.TRACK_PLAYING | KafuuCommandFlags.AUDIO_NODE,
      ["SendMessages"]
    );
  }
  public override async onCommandInteraction(
    context: KafuuCommandContext<false>
  ): Promise<void> {}

  public override async onAutocompleteInteraction(
    context: AutocompleteInteraction
  ): Promise<void> {}
}
