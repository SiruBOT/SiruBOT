/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Constants, Node } from "shoukaku";
import { SlashCommandBuilder } from "@discordjs/builders";

import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandContext,
  KafuuCommandCategory,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { EmbedFactory, ExtendedEmbed } from "@/utils/embed";
import { humanizeSeconds } from "@/utils/formatter";

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
  // eslint-disable-next-line security/detect-object-injection
  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
}

const STATE_STRING = [
  "CONNECTING",
  "CONNECTED",
  "DISCONNECTING",
  "DISCONNECTED",
];
export default class NodeInfoCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("debuginfo")
      .setNameLocalizations({
        ko: "디버그",
      })
      .setDescription(
        "Shows bot's debug info (Usally uses support identify errors)"
      )
      .setDescriptionLocalizations({
        ko: "봇의 디버그 정보를 보여드려요.",
      });
    super(
      slashCommand,
      client,
      KafuuCommandCategory.MUSIC,
      [KafuuCommandPermission.EVERYONE],
      KafuuCommandFlags.NOTHING,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    const nodes: Node[] = [...this.client.audio.nodes.values()];
    const onlineNodes: Node[] = nodes.filter(
      (v) => v.state === Constants.State.CONNECTED
    );
    const totalPlayers: number = onlineNodes
      .map((e) => e.stats!.players)
      .reduce((a, b) => a + b, 0);
    const totalPlayingPlayers: number = onlineNodes
      .map((e) => e.stats!.playingPlayers)
      .reduce((a, b) => a + b, 0);
    const nodeInfoEmbed: ExtendedEmbed = EmbedFactory.createEmbed();
    nodeInfoEmbed.setTitle("📡  Node status");
    nodeInfoEmbed.setTimestamp(new Date());
    nodeInfoEmbed.setDescription(
      `All nodes: **${nodes.length}** | Online nodes: **${onlineNodes.length}**\n` +
        `Total players: **${totalPlayers}** | Total playing players: **${totalPlayingPlayers}**`
    );
    nodeInfoEmbed.addFields(
      nodes.map((node) => {
        const cpuStats = node?.stats?.cpu;
        return {
          name: `**${node.name}**`,
          value:
            `State: **${STATE_STRING[node.state]}**\n` +
            (node.state === Constants.State.CONNECTED)
              ? `Players: **${node?.stats?.players ?? 0}**\n` +
                `Playing Players: **${node?.stats?.playingPlayers ?? 0}**\n` +
                `Uptime: **${humanizeSeconds(
                  node?.stats?.uptime ?? 0,
                  true
                )}**\n` +
                `Cores: **${cpuStats?.cores ?? "Not detected"}**\n` +
                `Lavalink Load: **${this.formatLoad(
                  cpuStats?.lavalinkLoad
                )}%**\n` +
                `System Load: **${this.formatLoad(cpuStats?.systemLoad)}%**\n` +
                `Used Memory: **${niceBytes(
                  node?.stats?.memory?.used ?? 0
                )}**\n` +
                `Free Memory: **${niceBytes(
                  node?.stats?.memory?.free ?? 0
                )}**\n` +
                `Frames Sent: **${node?.stats?.frameStats?.sent ?? 0}**\n` +
                `Frames Nulled: **${node?.stats?.frameStats?.nulled ?? 0}**\n` +
                `Frames Deficit: **${node?.stats?.frameStats?.deficit ?? 0}**\n`
              : "",
          inline: true,
        };
      })
    );
    await interaction.reply({ embeds: [nodeInfoEmbed] });
  }

  private formatLoad(load = 0): string {
    return Number(load * 100).toFixed(2);
  }
}
