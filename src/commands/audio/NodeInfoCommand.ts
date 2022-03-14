import { SlashCommandBuilder } from "@discordjs/builders";
import * as Discord from "discord.js";
import { Constants, ShoukakuSocket } from "shoukaku";
import { BaseCommand, Client } from "../../structures";
import { CommandCategories, CommandPermissions } from "../../types";
import { EmbedFactory, Formatter } from "../../utils";
import { ExtendedEmbed } from "../../utils/ExtendedEmbed";

// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript/23625419
const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
function niceBytes(x: number): string {
  let l = 0;
  let n = parseInt(x.toString(), 10) || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }
  // include a decimal point and a tenths-place digit if presenting
  // less than ten of KB or greater units
  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
}

const STATE_STRING = [
  "CONNECTING",
  "CONNECTED",
  "DISCONNECTING",
  "DISCONNECTED",
];
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
  ): Promise<void> {
    const nodes: ShoukakuSocket[] = [...this.client.audio.nodes.values()];
    const onlineNodes: ShoukakuSocket[] = nodes.filter(
      (v) => v.state === Constants.state.CONNECTED
    );
    const totalPlayers: number = onlineNodes
      .map((e) => e.stats.players)
      .reduce((a, b) => a + b);
    const totalPlayingPlayers: number = onlineNodes
      .map((e) => e.stats.playingPlayers)
      .reduce((a, b) => a + b);
    const nodeInfoEmbed: ExtendedEmbed = EmbedFactory.createEmbed();
    nodeInfoEmbed.setTitle("📡  Node status");
    nodeInfoEmbed.setTimestamp(new Date());
    nodeInfoEmbed.setDescription(
      `All nodes: **${nodes.length}** | Online nodes: **${onlineNodes.length}**\n` +
        `Total players: **${totalPlayers}** | Total playing players: **${totalPlayingPlayers}**`
    );
    for (const node of nodes) {
      const { cores, lavalinkLoad, systemLoad } = node.stats.cpu;
      nodeInfoEmbed.addField(
        `**${node.name}**`,
        `State: **${STATE_STRING[node.state]}**\n` +
          `Uptime: **${Formatter.humanizeSeconds(
            node.stats.uptime / 1000
          )}**\n` +
          `Cores: **${cores}**\n` +
          `Lavalink Load: **${this.formatLoad(lavalinkLoad)}%**\n` +
          `System Load: **${this.formatLoad(systemLoad)}%**\n` +
          `Used Memory: **${niceBytes(node.stats.memory.used)}**\n` +
          `Free Memory: **${niceBytes(node.stats.memory.free)}**\n` +
          `Frames Sent: **${node.stats.frameStats.sent}**\n` +
          `Frames Nulled: **${node.stats.frameStats.nulled}**\n` +
          `Frames Deficit: **${node.stats.frameStats.deficit}**\n`
      );
    }
    interaction.reply({ embeds: [nodeInfoEmbed] });
  }

  private formatLoad(load: number): string {
    return Number(load * 100).toFixed(2);
  }
}
