import { SlashCommandBuilder } from "@discordjs/builders";
import * as Discord from "discord.js";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../types";
import { EmbedFactory } from "../../utils";

export default class PingCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("ping")
      .setNameLocalizations({
        ko: "핑",
      })
      .setDescription("Replies with ping!")
      .setDescriptionLocalizations({
        ko: "봇의 반응 속도를 보여드려요!",
      });
    super(
      slashCommand,
      client,
      CommandCategories.GENERAL,
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

  public async onCommandInteraction({
    interaction,
  }: ICommandContext): Promise<void> {
    const pingEmbed: Discord.EmbedBuilder = EmbedFactory.createEmbed();
    await interaction.deferReply();
    pingEmbed.setDescription(
      `Discord -> BOT -> Discord | ${
        new Date().getTime() - interaction.createdTimestamp
      }ms\nDiscord <-> BOT | ${this.client.ws.ping}ms`
    );
    await interaction.editReply({ embeds: [pingEmbed] });
  }
}
