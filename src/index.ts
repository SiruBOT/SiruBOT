import "module-alias/register";
import yaml from "yaml";
import Cluster from "discord-hybrid-sharding";

import { Colors, RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import { Routes, APIApplication } from "discord-api-types/v9";
import { REST as DiscordREST } from "@discordjs/rest";

import { ArgumentParser } from "argparse";
import { stat, readFile } from "fs/promises";

import { Logger } from "tslog";
import FastGlob from "fast-glob";
import { fetch, Response } from "undici";

import { BaseCommand } from "@/structures";
import { WebhookNotifier } from "@/utils/webhooknotifier";
import Fastify from "fastify";
import { generateGlobPattern } from "@/utils/formatter";
import type {
  KafuuBootStrapperArgs,
  DiscordGatewayResponse,
} from "@/types/bootstrapper";
import type { KafuuSettings } from "@/types/settings";

import { version, name } from "../package.json";

// Args Parser
const parser: ArgumentParser = new ArgumentParser({
  description: "SiruBOT Boot CLI",
  add_help: true,
});

parser.add_argument("-r", "--register", {
  help: "Update slash commands",
  default: false,
  action: "store_true",
  required: false,
});

parser.add_argument("-clean", "--clean-commands", {
  help: "Clean commands",
  default: false,
  action: "store_true",
  required: false,
});

parser.add_argument("-s", "--shard", {
  help: "Enable auto sharding",
  default: false,
  action: "store_true",
  required: false,
});

parser.add_argument("-d", "--debug", {
  help: "Enable debug logging",
  default: false,
  action: "store_true",
  required: false,
});

parser.add_argument("-c", "--config", {
  help: "Config file path",
  default: false,
  required: true,
});

parser.add_argument("-api", "--experimental-api", {
  help: "Enable experimental api",
  default: false,
  action: "store_true",
  required: false,
});

parser.add_argument("-p", "--port", {
  help: "Port for experimental api",
  default: 3000,
  required: false,
});

// Parse Args
const args: KafuuBootStrapperArgs = parser.parse_args();
// Logger setup
const LOGGER_NAME = "BootStrapper";
const log: Logger = new Logger({
  name: LOGGER_NAME,
  minLevel: args.debug ? "debug" : "info",
});

/* ---------------- BOOT CALL ---------------- */
boot();

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

/* Async function for boot */
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
  const parsedConfig: KafuuSettings = yaml.parse(fileContent);
  const restClient = new DiscordREST({ version: "9" });
  restClient.setToken(parsedConfig.bot.token);

  let webhookNotifier: WebhookNotifier | undefined;

  if (parsedConfig.webhook) {
    log.info(
      `Webhook notifier enabled. (id: ${parsedConfig.webhook.id}) (token: ${parsedConfig.webhook.token})`
    );
    webhookNotifier = new WebhookNotifier(
      LOGGER_NAME,
      parsedConfig.webhook.id,
      parsedConfig.webhook.token,
      parsedConfig.bot.owners,
      log
    );
  }

  const fatal = (err: Error): void => {
    log.fatal(err);
    if (webhookNotifier) {
      webhookNotifier
        ?.safeSendEmbed(
          webhookNotifier
            .fatalEmbed()
            .setTitle("Fatal Error")
            .setColor(Colors.Red)
            .setDescription("FATAL " + err.stack?.slice(0, 1000)),
          true // It's important
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

  if (args.clean_commands) {
    await cleanSlashCommands();
    return;
  }

  if (args.shard) {
    // Autosharding async function
    await autoSharding();
  } else {
    log.warn("Single bot mode is currently not supported. use --shard option.");
  }

  async function cleanSlashCommands() {
    log.warn("This option will delete all slash commands in your application.");
    log.debug("Fetch application info from applicationInfo endpoint..");
    // Get applicationCommands from discord api (Old thing)
    const applicationInfo: APIApplication = (await restClient.get(
      Routes.oauth2CurrentApplication()
    )) as APIApplication;
    if (!applicationInfo) throw new Error("Application info not found");
    // Replace All Slash commands
    await restClient.put(
      process.env.DEVGUILD
        ? Routes.applicationGuildCommands(
            applicationInfo.id,
            process.env.DEVGUILD
          )
        : Routes.applicationCommands(applicationInfo.id),
      {
        body: [],
      }
    );
    const publishAt: string = process.env.DEVGUILD
      ? "applicationGuildCommands (/) at " + process.env.DEVGUILD
      : "applicationCommands (/)";
    const logStr = `All slash commands cleared on ${publishAt}`;
    log.info(logStr);
    webhookNotifier?.safeSendEmbed(
      webhookNotifier
        .warnEmbed()
        .setTitle(`🗒️ Commands cleared`)
        .setDescription(logStr)
    );
  }

  async function updateSlashCommands() {
    log.info("Update slash commands...");
    log.debug("Fetch global commands info from applicationCommands endpoint..");
    // Get applicationCommands from discord api (Old thing)
    const applicationInfo: APIApplication = (await restClient.get(
      Routes.oauth2CurrentApplication()
    )) as APIApplication;
    if (!applicationInfo) throw new Error("Application info not found");

    const commandFiles: string[] = await FastGlob(
      generateGlobPattern(__dirname, "commands")
    );
    const slashCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];
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
      log.debug(`Validating command file ${commandPath}`);
      slashCommands.push(commandInstance.slashCommand.toJSON());
    }

    // Replace All Slash commands
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

  //#region AutoSharding
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
      const gatewayJson = (await gatewayFetch.json()) as DiscordGatewayResponse;
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
          respawn: true,
          execArgv: ["--trace-warnings"],
          shardArgs: [JSON.stringify(parsedConfig), JSON.stringify(args)],
        }
      );
      log.info(
        `total Shards: ${clusterManager.totalShards}, total Clusters: ${clusterManager.totalClusters}`
      );
      clusterManager.on("clusterCreate", (cluster: Cluster.Cluster) => {
        log.info(
          `Launched Cluster ${cluster.id} (${cluster.id + 1} of ${
            clusterManager.totalClusters
          })`
        );
        // Event Listen
        cluster.on("death", () => {
          log.error(`Cluster death (#${cluster.id})`);
          webhookNotifier?.clusterDeath(cluster);
        });
        cluster.on("error", (error) => {
          log.error(`Cluster error (#${cluster.id})`, error);
          webhookNotifier?.clusterError(cluster, error);
        });
        cluster.on("spawn", () => {
          const spawnedTime = new Date().getTime();
          log.info(
            `Cluster spawned (${cluster.id + 1}/${
              cluster.manager.totalClusters
            })`
          );
          webhookNotifier?.clusterSpawned(cluster);
          cluster.removeAllListeners("ready");
          cluster.once("ready", () => {
            log.info(`Cluster #${cluster.id} ready`);
            webhookNotifier?.clusterReady(
              cluster,
              new Date().getTime() - spawnedTime
            );
          });
        }); // Spawn
      });
      clusterManager.spawn({ timeout: -1 });

      // Start Web Server
      if (args.experimental_api) {
        const fastify = Fastify({ logger: true });

        fastify.get("/stats", async () => {
          const clusters = [...clusterManager.clusters.values()];
          const clustersInfo = [];
          const statusInfo = await clusterManager.broadcastEval(
            "this.statsInfo()"
          );
          for (const cluster of clusters) {
            clustersInfo.push({
              clusterId: cluster.id,
              heartbeat: cluster.heartbeat,
              ready: cluster.ready,
              ...statusInfo[cluster.id],
            });
          }
          const status = {
            clusterCount: clusterManager.totalClusters,
            clusterSize: clusters.length,
            clustersInfo,
          };
          return status;
        });

        await fastify.listen({ port: args.port ?? 3000 });
        log.info(
          "Experimental API server started on port " + args.port ?? 3000
        );
      }
    } catch (err) {
      log.error(err);
    }
  }
  //#endregion
}
