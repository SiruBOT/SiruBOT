import { SlashCommandBuilder } from "@discordjs/builders";
import * as Discord from "discord.js";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../types";
import { CommandRequirements } from "../../types/CommandTypes/CommandRequirements";
import { EmbedFactory } from "../../utils";
import locale from "../../locales/";
import { fetch } from "undici";

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
      CommandRequirements.NOTHING,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: ICommandContext): Promise<void> {
    const pingEmbed: Discord.EmbedBuilder = EmbedFactory.createEmbed();

    const deferReply = await interaction.deferReply({ fetchReply: true });
    const deferReplyTime = Math.round(
      deferReply.createdTimestamp - interaction.createdTimestamp
    );

    pingEmbed.setDescription(
      locale.format(
        interaction.locale,
        "PING_PONG_EMBED",
        interaction.member.displayName,
        (deferReplyTime / 1000).toFixed(2),
        deferReplyTime.toString(),
        (this.client.ws.ping / 1000).toFixed(2),
        this.client.ws.ping.toString()
      )
    );

    await interaction.editReply({ embeds: [pingEmbed] });
  }
}
