import { SlashCommandBuilder } from "@discordjs/builders";
import * as Discord from "discord.js";
import { BaseCommand, Client } from "../../structures";
import { CommandCategories, CommandPermissions } from "../../types";

export default class NodeInfoCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("nodeinfo")
      .setDescription("봇의 음성 서버 정보를 보여드려요");
    super(
      slashCommand,
      client,
      CommandCategories.GENERAL,
      [CommandPermissions.EVERYONE],
      {
        audioNode: false,
        trackPlaying: false,
        guildPermissions: ["SEND_MESSAGES"],
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceConnected: false,
        },
      }
    );
  }

  public async runCommand(
    interaction: Discord.CommandInteraction
  ): Promise<void> {}
}
