import yaml from "yaml";
import Cluster from "discord-hybrid-sharding";

import { version, name } from "../package.json";
import type { IBootStrapperArgs, ISettings, IGatewayResponse } from "./types";

import { ArgumentParser } from "argparse";
import { stat, readFile } from "fs/promises";
import { Logger } from "tslog";
import { fetch, Response } from "undici";
import { WebhookNotifier } from "./structures";

// fs.exists is deprecated
async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (err) {
    return false;
  }
}

// read file when file exists & file extension == .yaml
async function safeReadFile(path: string): Promise<string> {
  const fileExists = await exists(path);
  if (!fileExists) throw new Error(`File ${path} does not exist`);
  if (typeof path == "string" && !path.endsWith(".yaml"))
    throw new Error(`File ${path} is not a YAML file`);
  return readFile(path, "utf-8");
}

// Args Parser
const parser: ArgumentParser = new ArgumentParser({
  description: "SiruBOT Boot CLI",
  add_help: true,
});

parser.add_argument("-s", "--shard", {
  help: "Enable auto sharding",
  default: false,
  action: "store_true",
});

parser.add_argument("-d", "--debug", {
  help: "Enable debug logging",
  default: false,
  action: "store_true",
});

parser.add_argument("-c", "--config", {
  help: "Config file path",
  default: false,
  required: true,
});

// Parse Args
const args: IBootStrapperArgs = parser.parse_args();
// Logger setup
const LOGGER_NAME = "Bootstrap";
const log: Logger = new Logger({
  name: LOGGER_NAME,
  minLevel: args.debug ? "debug" : "info",
});

const fatal = (err: Error): void => {
  log.fatal(err);
  process.exit(1);
};

process.on("uncaughtException", fatal);
process.on("unhandledRejection", fatal);

// Async function for boot
async function boot() {
  // Read config file
  log.info(`${name} version: ${version}, log level: ${log.settings.minLevel}`);
  log.debug(
    `config file: ${args.config}, shard: ${
      args.shard ? "Auto sharding enabled" : "Auto sharding disabled"
    }, debug: ${
      args.debug ? "Debug logging enabled" : "Debug logging disabled"
    }`
  );
  log.debug(`Loading config from ${args.config}`);

  const fileContent: string = await safeReadFile(args.config);
  const parsedConfig: ISettings = yaml.parse(fileContent);
  let webhookNotifier: WebhookNotifier | undefined;

  if (parsedConfig.webhook) {
    log.info(
      `Webhook notifier enabled. (id: ${parsedConfig.webhook.id}) (token: ${parsedConfig.webhook.token})`
    );
    webhookNotifier = new WebhookNotifier(
      LOGGER_NAME,
      parsedConfig.webhook.id,
      parsedConfig.webhook.token,
      log
    );
  }

  if (args.shard) {
    // Autosharding async function
    autoSharding();
  } else {
    log.info("Booting single bot mode");
    // TODO: Implement single bot mode
  }

  async function autoSharding() {
    log.info("Auto sharding enabled, booting shards...");
    try {
      const token: string = parsedConfig.bot.token;
      log.debug("Fetching shard count from Discord.");

      // Fetch shard_count from Discord Gateway
      const gatewayFetch: Response = await fetch(
        `https://discord.com/api/gateway/bot`,
        {
          headers: { Authorization: `Bot ${token}` },
        }
      );
      if (!gatewayFetch.ok)
        throw new Error(
          "Failed to fetch shard count. response code: " +
            gatewayFetch.status +
            " " +
            gatewayFetch.statusText
        );
      // Cast gateway response to IGatewayResponse
      const gatewayJson = (await gatewayFetch.json()) as IGatewayResponse;
      log.debug(
        `Shard count: ${gatewayJson.shards}, Gateway url: ${gatewayJson.url}`
      );
      // Start sharding
      const clusterManager: Cluster.Manager = new Cluster.Manager(
        __dirname + "/bot.js",
        {
          totalShards: gatewayJson.shards,
          totalClusters: Math.ceil(
            gatewayJson.shards / parsedConfig.bot.shardsPerClusters
          ),
          token,
          mode: "process",
          shardArgs: [JSON.stringify(parsedConfig), JSON.stringify(args)],
          usev13: true,
        }
      );
      log.info(
        `total Shards: ${clusterManager.totalShards}, total Clusters: ${clusterManager.totalClusters}`
      );
      clusterManager.on("clusterCreate", (cluster: Cluster.Cluster) => {
        cluster.on("spawn", () => {
          webhookNotifier?.clusterSpawned(cluster);
        });
        log.info(
          `Launched Cluster ${cluster.id} (${cluster.id + 1} of ${
            clusterManager.totalClusters
          })`
        );
      });
      clusterManager.spawn(undefined, undefined, -1);
    } catch (err) {
      log.error(err);
    }
  } // AutoSharding
}

boot();
