import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";

export default class LyricsCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("melonchart")
      .setNameLocalizations({
        ko: "멜론차트",
      })
      .setDescription("Get daliy top 100 from melon")
      .setDescriptionLocalizations({
        ko: "멜론차트 검색 결과를 보여드려요!",
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
  }: KafuuCommandContext): Promise<void> {
    await interaction.deferReply();
  }
}
