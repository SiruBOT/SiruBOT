import Discord from "discord.js";
import type { Cluster } from "discord-hybrid-sharding";
import type { Logger } from "tslog";
import { EmbedFactory } from "../utils";
import { OK_COLOR } from "../constant/Constants";
export class WebhookNotifier extends Discord.WebhookClient {
  name: string;
  log: Logger;

  constructor(name: string, id: string, token: string, log: Logger) {
    super({ id, token });
    this.name = name;
    this.log = log;
  }

  infoEmbed(): Discord.MessageEmbed {
    return this.buildEmbed().setColor(OK_COLOR);
  }

  buildEmbed(): Discord.MessageEmbed {
    const embed: Discord.MessageEmbed = EmbedFactory.createEmbed();
    embed
      .setFooter({ text: EmbedFactory.footerString })
      .setTimestamp(new Date());
    return embed;
  }

  clusterSpawned(cluster: Cluster): void {
    const embed: Discord.MessageEmbed = this.infoEmbed();
    embed.setTitle(
      `💡  Cluster spawned (${cluster.id + 1}/${cluster.manager.totalClusters})`
    ).setDescription(`
      Cluster Id: ${cluster.id}
      Shards Per Clusters: ${
        typeof cluster.manager.totalShards === "string" ||
        typeof cluster.manager.totalClusters === "string"
          ? "auto"
          : Math.ceil(
              cluster.manager.totalShards / cluster.manager.totalClusters
            )
      }
    `);
    this.safeSendEmbed(embed);
  }

  async safeSendEmbed(embed: Discord.MessageEmbed): Promise<void> {
    try {
      await this.send({ embeds: [embed] });
    } catch {}
  }
}
