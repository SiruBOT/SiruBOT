import { SlashCommandBuilder } from "@discordjs/builders";
import * as Discord from "discord.js";
import { BaseCommand, Client } from "../../structures";
import { CommandCategories, CommandPermissions } from "../../types";

export default class LyricsCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("lyrics")
      .setDescription("노래의 가사를 찾아드려요")
      .addStringOption((option) => {
        return option
          .setName("query")
          .setDescription("가사 검색어")
          .setRequired(true);
      });
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
