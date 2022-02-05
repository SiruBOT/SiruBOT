import { SlashCommandBuilder } from "@discordjs/builders";
import * as Discord from "discord.js";

import { BaseCommand, Client } from "../../structures";
import { CommandCategories, CommandPermissions } from "../../types";

export default class PingCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with ping!");
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
    interaction: Discord.CommandInteraction<Discord.CacheType>
  ): Promise<void> {
    const calculatedPing = interaction.createdTimestamp - new Date().getTime();
    await interaction.reply({
      content: `Pong! interaction handle ping: ${calculatedPing}ms\nWebsocket ping: ${interaction.client.ws.ping}ms`,
    });
  }
}
