import Discord, { Colors, codeBlock } from "discord.js";
import type { Cluster } from "discord-hybrid-sharding";
import type { Logger } from "tslog";
import { EmbedFactory } from "@/utils/embed";
import { OK_COLOR, WARN_COLOR } from "@/constants/message";
import { ExtendedEmbed } from "@/utils/embed";
export class WebhookNotifier extends Discord.WebhookClient {
  name: string;
  owners: string[];
  log: Logger;

  constructor(
    name: string,
    id: string,
    token: string,
    owners: string[],
    log: Logger,
  ) {
    super({ id, token });
    this.name = name;
    this.log = log;
    this.owners = owners;
  }

  infoEmbed(): ExtendedEmbed {
    return this.buildEmbed("Info").setColor(OK_COLOR);
  }

  warnEmbed(): ExtendedEmbed {
    return this.buildEmbed("Warn").setColor(WARN_COLOR);
  }

  fatalEmbed(): ExtendedEmbed {
    return this.buildEmbed("Fatal").setColor(Colors.Red);
  }

  buildEmbed(level: string): ExtendedEmbed {
    const embed: ExtendedEmbed = EmbedFactory.createEmbed();
    embed.setFooter({ text: level }).setTimestamp(new Date());
    return embed;
  }

  clusterSpawned(cluster: Cluster): void {
    const embed: Discord.EmbedBuilder = this.infoEmbed();
    embed.setTitle(
      `💡  Cluster spawned (${cluster.id + 1}/${
        cluster.manager.totalClusters
      })`,
    ).setDescription(`
      Cluster Id: ${cluster.id}
      Shards Per Clusters: ${
        typeof cluster.manager.totalShards === "string" ||
        typeof cluster.manager.totalClusters === "string"
          ? "auto"
          : Math.ceil(
              cluster.manager.totalShards / cluster.manager.totalClusters,
            )
      }
    `);
    this.safeSendEmbed(embed);
  }

  clusterError(cluster: Cluster, error: Error): void {
    const embed: Discord.EmbedBuilder = this.warnEmbed();
    embed.setTitle(`⚠️  Cluster Error #${cluster.id}`);
    embed.setDescription(
      codeBlock("ts", error.stack ?? "N/A, Check the console."),
    );
    this.safeSendEmbed(embed, true);
  }

  clusterDeath(cluster: Cluster): void {
    const embed: Discord.EmbedBuilder = this.warnEmbed();
    embed.setTitle(`⚠️  Cluster Death #${cluster.id}`);
    this.safeSendEmbed(embed, true);
  }

  clusterReady(cluster: Cluster, elapsedTime: number): void {
    const embed: Discord.EmbedBuilder = this.infoEmbed();
    embed.setTitle(`✅  Cluster Ready #${cluster.id}`);
    embed.setDescription("Took **" + elapsedTime + "ms** to Ready");
    this.safeSendEmbed(embed, true);
  }

  async safeSendEmbed(
    embed: Discord.EmbedBuilder,
    important = false,
  ): Promise<void> {
    try {
      await this.send({
        content: important
          ? this.owners.map((e) => "<@" + e + ">").join(", ")
          : undefined,
        embeds: [embed],
      });
    } catch {}
  }
}
