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
      .setName("settings")
      .setNameLocalizations({
        ko: "설정",
      })
      .setDescription("Change/Show bot's settings.")
      .setDescriptionLocalizations({
        ko: "봇의 설정을 변경하거나 볼 수 있어요.",
      })
      .addSubcommand((input) =>
        input
          .setName("defaultvoicech")
          .setDescription("Set guild's default voice channel.")
          .setNameLocalizations({
            ko: "음성채널",
          })
          .setDescriptionLocalizations({
            ko: "서버의 기본 음성 채널을 설정해요.",
          })
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription("ASDF")
              .addChannelTypes(Discord.ChannelType.GuildVoice)
          )
      );
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

  public override async onCommandInteraction({
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
