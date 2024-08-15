// Import discord.js and SlashCommandBuilder
import * as Discord from "discord.js";

// Import necessary modules and types
import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandCategory,
  KafuuCommandPermission,
  KafuuCommandContext,
} from "@/types/command";
import { KafuuCommandFlags } from "@/types/command";
import { EmbedFactory } from "@/utils/embed";
import { format } from "@/locales";

export default class PingCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new Discord.SlashCommandBuilder()
      .setName("ping")
      .setNameLocalizations({
        ko: "핑",
      })
      .setDescription("Replies with ping!")
      .setDescriptionLocalizations({
        ko: "봇의 반응 속도를 보여드려요!",
      });
    super({
      slashCommand,
      client,
      category: KafuuCommandCategory.GENERAL,
      permissions: [KafuuCommandPermission.EVERYONE],
      requirements: KafuuCommandFlags.NOTHING,
      botPermissions: ["SendMessages"],
    });
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    const pingEmbed: Discord.EmbedBuilder = EmbedFactory.createEmbed();

    const deferReply = await interaction.deferReply({ fetchReply: true });
    const deferReplyTime = Math.round(
      deferReply.createdTimestamp - interaction.createdTimestamp,
    );

    pingEmbed.setDescription(
      format(
        interaction.locale,
        "PING_PONG_EMBED",
        interaction.member.displayName,
        (deferReplyTime / 1000).toFixed(2),
        deferReplyTime.toString(),
        (this.client.ws.ping / 1000).toFixed(2),
        this.client.ws.ping.toString(),
      ),
    );

    await interaction.editReply({ embeds: [pingEmbed] });
  }
}
