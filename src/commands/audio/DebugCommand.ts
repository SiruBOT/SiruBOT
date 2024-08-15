/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Constants, Node } from "shoukaku";
import { SlashCommandBuilder } from "discord.js";

import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandContext,
  KafuuCommandCategory,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { EmbedFactory, ExtendedEmbed } from "@/utils/embed";
import { formatLoad, humanizeSeconds, niceBytes } from "@/utils/formatter";

export default class NodeInfoCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("audionode")
      .setNameLocalizations({
        ko: "음성서버",
      })
      .setDescription(
        "Shows bot's debug info (Usally uses support identify errors)",
      )
      .setDescriptionLocalizations({
        ko: "봇의 음성 서버 정보를 보여드려요.",
      });
    super({
      slashCommand,
      client,
      category: KafuuCommandCategory.MUSIC,
      permissions: [KafuuCommandPermission.EVERYONE],
      requirements: KafuuCommandFlags.NOTHING,
      botPermissions: ["SendMessages"],
    });
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    const nodes: Node[] = [...this.client.audio.nodes.values()];
    const onlineNodes: Node[] = nodes.filter(
      (v) => v.state === Constants.State.CONNECTED,
    );
    const totalPlayers: number = onlineNodes
      .map((e) => e.stats!.players)
      .reduce((a, b) => a + b, 0);
    const totalPlayingPlayers: number = onlineNodes
      .map((e) => e.stats!.playingPlayers)
      .reduce((a, b) => a + b, 0);

    const nodeInfoEmbed: ExtendedEmbed = EmbedFactory.createEmbed();
    nodeInfoEmbed.setTitle("📡  음성 서버 정보");
    nodeInfoEmbed.setTimestamp(new Date());

    const indicator = (a: number, b: number) => {
      if (a === 0 || b === 0) return "❔";
      return a / b >= 1 ? "🟢" : a / b >= 0.7 ? "🟡" : "🔴";
    };

    nodeInfoEmbed.setDescription(
      `음성 서버: **${nodes.length}** 개 | 온라인 서버: **${onlineNodes.length}** 개\n` +
        `전체 플레이어: **${totalPlayers}** 개 | 재생 중인 플레이어: **${totalPlayingPlayers}** 개`,
    );

    nodes.map((node) => {
      const nodeQuality =
        node.state === Constants.State.CONNECTED
          ? indicator(node.stats?.playingPlayers ?? 0, node.stats?.players ?? 0)
          : "🔴";
      nodeInfoEmbed.addFields({
        name: `${nodeQuality} | **${node.name}**`,
        value: `**${node.stats?.players ?? 0}** 개 플레이어 중 **${
          node.stats?.playingPlayers ?? 0
        }** 개 재생 중\n메모리 **${niceBytes(
          node.stats?.memory.used,
        )}** 사용 중 | CPU **${formatLoad(
          node.stats?.cpu.systemLoad,
        )}%** 사용 중\n업타임 **${msToHuman(node.stats?.uptime ?? 0)}**`,
      });
    });

    await interaction.reply({ embeds: [nodeInfoEmbed] });
  }
}

function msToHuman(ms: number): string {
  const sec = ms / 1000;
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = Math.floor(sec % 60);
  return `${hours ? `${hours}시간 ` : ""}${minutes ? `${minutes}분 ` : ""}${
    seconds ? `${seconds}초` : `${seconds}초`
  }`;
}
