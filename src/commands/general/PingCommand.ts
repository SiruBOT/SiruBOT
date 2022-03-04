import { SlashCommandBuilder } from "@discordjs/builders";
import * as Discord from "discord.js";
import { BaseCommand, Client } from "../../structures";
import { CommandCategories, CommandPermissions } from "../../types";
import { EmbedFactory } from "../../utils";

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
    interaction: Discord.CommandInteraction
  ): Promise<void> {
    const pingEmbed: Discord.MessageEmbed = EmbedFactory.createEmbed();
    await interaction.deferReply();
    pingEmbed.setDescription(
      `Discord -> BOT -> Discord | ${
        new Date().getTime() - interaction.createdTimestamp
      }ms\nDiscord <-> BOT | ${this.client.ws.ping}ms`
    );
    await interaction.editReply({ embeds: [pingEmbed] });
  }
}
