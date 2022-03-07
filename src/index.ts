import yaml from "yaml";
import Cluster from "discord-hybrid-sharding";

import { version, name } from "../package.json";
import type { IBootStrapperArgs, ISettings, IGatewayResponse } from "./types";

import { Routes, APIApplication } from "discord-api-types/v9";
import { REST as DiscordREST } from "@discordjs/rest";

import { ArgumentParser } from "argparse";
import { stat, readFile } from "fs/promises";
import { Logger } from "tslog";
import { fetch, Response } from "undici";
import { BaseCommand, Client, WebhookNotifier } from "./structures";
import { SlashCommandBuilder } from "@discordjs/builders";
import FastGlob from "fast-glob";

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

parser.add_argument("-r", "--register", {
  help: "Update slash commands",
  default: false,
  action: "store_true",
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

boot();

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

  const fatal = (err: Error): void => {
    log.fatal(err);
    if (webhookNotifier) {
      webhookNotifier
        ?.safeSendEmbed(
          webhookNotifier
            .buildEmbed()
            .setColor("RED")
            .setDescription("FATAL Error: " + err.stack?.slice(0, 1000))
        )
        .finally(() => {
          process.exit(2);
        });
    } else {
      process.exit(2);
    }
  };

  process.on("uncaughtException", fatal);
  process.on("unhandledRejection", fatal);

  if (args.register) {
    await updateSlashCommands();
    return;
  }
  if (args.shard) {
    // Autosharding async function
    await autoSharding();
  } else {
    log.info("Booting single bot mode");
    // TODO: Implement single bot mode
  }

  async function updateSlashCommands() {
    const restClient = new DiscordREST({ version: "9" });
    restClient.setToken(parsedConfig.bot.token);
    log.info("Update slash commands...");
    log.debug("Fetch global commands info from applicationCommands endpoint..");
    // Get applicationCommands from discord api (Old thing)
    const applicationInfo: APIApplication = (await restClient.get(
      Routes.oauth2CurrentApplication()
    )) as APIApplication;
    if (!applicationInfo) throw new Error("ApplicationInfo not found");

    const commandFiles: string[] = await FastGlob(
      Client.generateGlobPattern("commands")
    );
    const slashCommands: Omit<
      SlashCommandBuilder,
      "addSubcommand" | "addSubcommandGroup"
    >[] = [];
    log.info(`Found ${commandFiles.length} commands`);

    // Register commands to slashCommands array
    for (const commandPath of commandFiles) {
      log.debug(`Process command ${commandPath}`);
      const CommandClass = await import(commandPath);
      // Command file validation
      if (!CommandClass.default)
        throw new Error(
          "Command file is missing default export\n" + commandPath
        );
      const commandInstance: BaseCommand = new CommandClass.default();
      if (!(commandInstance instanceof BaseCommand))
        throw new Error(
          "Command file is not extends BaseCommand\n" + commandPath
        );
      slashCommands.push(commandInstance.slashCommand);
    }

    await restClient.put(
      process.env.DEVGUILD
        ? Routes.applicationGuildCommands(
            applicationInfo.id,
            process.env.DEVGUILD
          )
        : Routes.applicationCommands(applicationInfo.id),
      {
        body: slashCommands,
      }
    );
    const publishAt: string = process.env.DEVGUILD
      ? "applicationGuildCommands (/) at " + process.env.DEVGUILD
      : "applicationCommands (/)";
    const logStr = `${slashCommands.length} Commands successfully published on ${publishAt}`;
    log.info(logStr);
    webhookNotifier?.safeSendEmbed(
      webhookNotifier
        .infoEmbed()
        .setTitle(`🗒️  ${slashCommands.length} Commands published`)
        .setDescription(logStr)
    );
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
          shardsPerClusters: parsedConfig.bot.shardsPerClusters,
          token,
          mode: "process",
          shardArgs: [JSON.stringify(parsedConfig), JSON.stringify(args)],
        }
      );
      log.info(
        `total Shards: ${clusterManager.totalShards}, total Clusters: ${clusterManager.totalClusters}`
      );
      clusterManager.on("clusterCreate", (cluster: Cluster.Cluster) => {
        cluster.on("spawn", () => {
          log.info(
            `Cluster spawned (${cluster.id + 1}/${
              cluster.manager.totalClusters
            })`
          );
          webhookNotifier?.clusterSpawned(cluster);
        });
        cluster.on("ready", () => {
          log.info(`Cluster #${cluster.id} ready`);
        });
        log.info(
          `Launched Cluster ${cluster.id} (${cluster.id + 1} of ${
            clusterManager.totalClusters
          })`
        );
      });
      clusterManager.spawn({ timeout: -1 });
    } catch (err) {
      log.error(err);
    }
  } // AutoSharding
}
