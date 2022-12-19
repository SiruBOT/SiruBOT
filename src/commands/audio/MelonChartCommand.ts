import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../types";

export default class LyricsCommand extends BaseCommand {
  constructor(client: Client) {
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
  }: ICommandContext): Promise<void> {
    await interaction.deferReply();
  }
}
