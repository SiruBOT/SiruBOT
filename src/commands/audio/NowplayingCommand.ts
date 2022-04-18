import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../types";

export default class NowplayingCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("nowplaying")
      .setDescription("현재 재생 중인 곡의 정보를 보여드려요");
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
      {
        audioNode: true,
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

  public async runCommand({ interaction }: ICommandContext): Promise<void> {
    await interaction.reply({ content: "이이이잉 앗살라말라이쿰" });
  }
}
