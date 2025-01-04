import { SlashCommandBuilder } from "discord.js";

import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { Constants, Node } from "shoukaku";
import { EmbedFactory, ExtendedEmbed } from "@/utils/embed";
import { formatLoad, humanizeSeconds, niceBytes } from "@/utils/formatter";
import { promisify } from "util";

export default class MaintenanceCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("관리자")
      .setDescription("관리용 명령어")
      .addSubcommandGroup((group) => {
        return group
          .setName("노드")
          .setDescription("노드 관리 명령어")
          .addSubcommand((subcommand) =>
            subcommand.setName("재연결").setDescription("노드를 재연결합니다."),
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName("정보")
              .setDescription("노드 정보를 확인합니다."),
          );
      })
      .addSubcommandGroup((group) => {
        return group
          .setName("설정")
          .setDescription("설정 관리 명령어")
          .addSubcommand((subcommand) =>
            subcommand.setName("리로드").setDescription("설정을 리로드합니다."),
          );
      });
    super({
      slashCommand,
      client,
      category: KafuuCommandCategory.GENERAL,
      permissions: [KafuuCommandPermission.BOTOWNER],
      requirements: KafuuCommandFlags.NOTHING,
      botPermissions: [],
      allowedGuildIds: ["542599372836438016", "672586746587774976"],
    });
  }

  public override async onCommandInteraction({
    interaction,
    userPermissions,
  }: KafuuCommandContext): Promise<void> {
    switch (interaction.options.getSubcommandGroup(true)) {
      case "노드":
        switch (interaction.options.getSubcommand(true)) {
          case "재연결":
            return this.onNodeReconnect({ interaction, userPermissions });
          case "정보":
            return this.onNodeInfo({ interaction, userPermissions });
        }
      case "설정":
        switch (interaction.options.getSubcommand(true)) {
          case "리로드":
            return this.onReload({ interaction, userPermissions });
        }
      default:
        break;
    }
  }

  private async onNodeReconnect({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    if (!this.client.cluster) {
      await interaction.reply("클러스터링 기능이 꺼져있습니다.");
      return;
    }

    const getIcon = (state: string) => {
      return state.startsWith("연결 끊김")
        ? "🔴"
        : state.startsWith("연결 해제중")
          ? "🟡"
          : "🟢";
    };

    const beforeNodes: { [x: string]: string }[] =
      await this.client.cluster.broadcastEval("this.audio.nodeInfo()");

    const beforeEmbed = EmbedFactory.createEmbed();
    beforeEmbed.setTitle("🔌 노드 재연결");

    for (const clusterId in beforeNodes) {
      beforeEmbed.addFields({
        name: `클러스터 ID: ${clusterId}`,
        value: Object.keys(beforeNodes[clusterId])
          .map((node) => {
            return `${getIcon(beforeNodes[clusterId][node])} ${node} -> ${
              beforeNodes[clusterId][node]
            }`;
          })
          .join("\n"),
      });
    }

    const reply = await interaction.reply({
      embeds: [beforeEmbed],
      fetchReply: true,
    });

    await promisify(setTimeout)(3000);

    await this.client.cluster.broadcastEval("this.audio.reconnectNodes()");

    const afterNodes = await this.client.cluster.broadcastEval(
      "this.audio.nodeInfo()",
    );

    const afterEmbed = EmbedFactory.createEmbed();

    afterEmbed.setTitle("🔌 노드 재연결 완료");

    for (const clusterId in afterNodes) {
      afterEmbed.addFields({
        name: `클러스터 ID: ${clusterId}`,
        value: Object.keys(afterNodes[clusterId])
          .map((node) => {
            return `${getIcon(afterNodes[clusterId][node])} ${node} -> ${
              afterNodes[clusterId][node]
            }`;
          })
          .join("\n"),
      });
    }

    await reply.edit({ embeds: [afterEmbed] });
  }

  private async onNodeInfo({
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
    nodeInfoEmbed.setTitle("📡  Node status");
    nodeInfoEmbed.setTimestamp(new Date());
    nodeInfoEmbed.setDescription(
      `음성 서버: **${nodes.length}** 개 | 온라인 서버: **${onlineNodes.length}** 개\n` +
        `전체 플레이어: **${totalPlayers}** 개 | 재생 중인 플레이어: **${totalPlayingPlayers}** 개\n`,
    );

    nodeInfoEmbed.addFields(
      nodes.map((node) => {
        const cpuStats = node?.stats?.cpu;
        return {
          name: `음성 서버 **${node.name}**`,
          value:
            `상태: **${
              ["연결 중", "연결됨", "연결 해제중", "연결 끊김"][node.state]
            }**\n` +
            (node.state === Constants.State.CONNECTED)
              ? `플레이어: **${node?.stats?.players ?? 0}**\n` +
                `재생 중인 플레이어: **${
                  node?.stats?.playingPlayers ?? 0
                }**\n` +
                `업타임: **${humanizeSeconds(
                  node?.stats?.uptime ?? 0,
                  true,
                )}**\n` +
                `코어 개수: **${cpuStats?.cores ?? "알 수 없음"}**\n` +
                `라바링크 로드: **${formatLoad(cpuStats?.lavalinkLoad)}%**\n` +
                `시스템 로드: **${formatLoad(cpuStats?.systemLoad)}%**\n` +
                `사용 중 메모리: **${niceBytes(
                  node?.stats?.memory?.used ?? 0,
                )}**\n` +
                `여유 메모리: **${niceBytes(
                  node?.stats?.memory?.free ?? 0,
                )}**\n` +
                `할당된 메모리: **${niceBytes(
                  node?.stats?.memory?.allocated ?? 0,
                )}**\n` +
                `예약 가능한 메모리: **${niceBytes(
                  node?.stats?.memory?.reservable ?? 0,
                )}**\n` +
                `보낸 프레임: **${node?.stats?.frameStats?.sent ?? 0}**\n` +
                `무효화된 프레임: **${
                  node?.stats?.frameStats?.nulled ?? 0
                }**\n` +
                `부족한 프레임: **${node?.stats?.frameStats?.deficit ?? 0}**\n`
              : "",
          inline: true,
        };
      }),
    );
    await interaction.reply({ embeds: [nodeInfoEmbed] });
  }

  private async onReload({ interaction }: KafuuCommandContext): Promise<void> {
    if (!this.client.cluster) {
      await interaction.reply("클러스터링 기능이 꺼져있습니다.");
      return;
    }

    await interaction.deferReply();
    this.client.cluster.broadcastEval("this.reloadConfig()");

    await promisify(setTimeout)(3000);

    const nodeInfoEmbed: ExtendedEmbed = EmbedFactory.createEmbed();
    nodeInfoEmbed.setTitle("🔄  설정 리로드 완료");
    nodeInfoEmbed.setDescription("설정이 리로드되었습니다.");
    nodeInfoEmbed.setTimestamp(new Date());

    await interaction.editReply({ embeds: [nodeInfoEmbed] });
  }
}
