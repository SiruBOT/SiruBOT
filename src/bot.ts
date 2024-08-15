// Import module-alias for path alias
import "module-alias/register";
// Import discord.js stuff
import Discord, { GatewayIntentBits } from "discord.js";
import { ClusterClient, getInfo } from "discord-hybrid-sharding";

import { Logger } from "tslog";

// Import Kafuu
import { KafuuClient } from "@/structures";
import type { KafuuBootStrapperArgs } from "@/types/bootstrapper";
import type { KafuuSettings } from "@/types/settings";
import { createLogger } from "./utils/logger";

let argvSettings: KafuuSettings;
let bootStrapperArgs: KafuuBootStrapperArgs;

try {
  argvSettings = JSON.parse(process.argv[2]);
  bootStrapperArgs = JSON.parse(process.argv[3]);
} catch {
  console.error(process.argv);
  throw new Error(
    "Failed to parse process.argv[2] and process.argv[3] (Bot config and Bootstrapper args)",
  );
}

// Setup logger
const log: Logger = createLogger({
  name: bootStrapperArgs.shard ? `cluster-${getInfo().CLUSTER}` : "standalone",
  shardInfo: bootStrapperArgs.shard
    ? {
        clusterId: getInfo().CLUSTER,
        shardIds: getInfo().SHARD_LIST,
        totalShards: getInfo().TOTAL_SHARDS,
      }
    : undefined,
  consoleLevel: bootStrapperArgs.debug ? "debug" : "info",
});

// Setup Client
const intents: GatewayIntentBits[] = [
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
];

log.debug(`Client intents: ${intents.join(", ")}`);

const clientOptions: Discord.ClientOptions = {
  intents,
};

if (bootStrapperArgs.shard) {
  log.debug(
    "Sharding enabled. setup clientOptions.shards, clientOptions.shardCount",
  );
  clientOptions.shards = getInfo().SHARD_LIST;
  clientOptions.shardCount = getInfo().TOTAL_SHARDS;
  log.info(
    `Sharding Info | shards: [ ${clientOptions.shards.join(
      ", ",
    )} ], shardCount: ${clientOptions.shardCount}`,
  );
}

log.debug("Create client instance");
const client = new KafuuClient(
  clientOptions,
  log,
  argvSettings,
  bootStrapperArgs,
);

if (bootStrapperArgs.shard) {
  log.debug("Sharding enabled. Set Client.cluster to Cluster.Client");
  client.cluster = new ClusterClient(client);
}

// ignore uncaughtException, unhandledRejection
const uncaughtException = (err: Error): void => {
  log.error("Uncaught exception: ", err);
};

const unhandledRejection = (
  _reason: string,
  promise: Promise<unknown>,
): void => {
  promise.catch((reason) => {
    log.fatal("Uncaught rejection, reason: ", reason);
  });
};

log.debug("Pre configuration complete. Call client.start() function.");
client
  .start()
  .then(() => {
    process.on("uncaughtException", uncaughtException);
    process.on("unhandledRejection", unhandledRejection);
  })
  .catch((err) => {
    log.error(
      "Failed to start the bot. for more information, start with -d(ebug) option",
      err,
    );
    process.exit(2);
  });
