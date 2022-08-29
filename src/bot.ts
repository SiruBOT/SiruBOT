// Import sentry
import * as Sentry from "@sentry/node";
// Import @sentry/tracing
import * as Tracing from "@sentry/tracing";
// Import discord.js/sharding stuff
import Discord, { GatewayIntentBits } from "discord.js";
import Cluster from "discord-hybrid-sharding";
// Import logger for logging
import { Logger } from "tslog";
// Import structures
import { Client } from "./structures";
import * as URLUtils from "./utils/URLUtils";
import type { ISettings, IBootStrapperArgs } from "./types";
import { RewriteFrames } from "@sentry/integrations";

let argvSettings: ISettings;
let bootStrapperArgs: IBootStrapperArgs;

try {
  argvSettings = JSON.parse(process.argv[2]);
  bootStrapperArgs = JSON.parse(process.argv[3]);
} catch {
  console.error(process.argv);
  throw new Error(
    "Failed to parse process.argv[2] and process.argv[3] (Bot config and Bootstrapper args)"
  );
}

// Setup logger
const log: Logger = new Logger({
  name: bootStrapperArgs.shard ? `Cluster#${Cluster.data.CLUSTER}` : "Client",
  minLevel: bootStrapperArgs.debug ? "debug" : "info",
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
    "Sharding enabled. setup clientOptions.shards, clientOptions.shardCount"
  );
  clientOptions.shards = Cluster.data.SHARD_LIST;
  clientOptions.shardCount = Cluster.data.TOTAL_SHARDS;
  log.info(
    `Sharding Info | shards: [ ${clientOptions.shards.join(
      ", "
    )} ], shardCount: ${clientOptions.shardCount}`
  );
}

log.debug("Create client instance");
const client = new Client(clientOptions, log, argvSettings, bootStrapperArgs);

if (bootStrapperArgs.shard) {
  log.debug("Sharding enabled. Set Client.cluster to Cluster.Client");
  client.cluster = new Cluster.Client(client);
}

if (
  argvSettings?.sentryDsn &&
  URLUtils.isURL(argvSettings.sentryDsn as string)
) {
  log.info(`Sentry enabled, DSN: ${argvSettings.sentryDsn}`);
  Sentry.init({
    dsn: argvSettings.sentryDsn,
    debug: bootStrapperArgs.debug,
    tracesSampleRate: 1.0,
    integrations: [
      new RewriteFrames({
        root: global.__dirname,
      }),
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.BrowserTracing(),
    ],
  });
  if (bootStrapperArgs.shard && client.cluster) {
    log.debug(`Sentry sets up. set clusterId tag to ${client.cluster.id}`);
    Sentry.setTag("clusterId", client.cluster.id);
  }
} else {
  log.warn(`Sentry disabled. Sentry URL: ${argvSettings.sentryDsn}`);
}

// ignore uncaughtException, unhandledRejection
const uncaughtException = (err: Error): void => {
  log.error("Uncaught exception: ", err);
  Sentry.captureException(err);
};

const unhandledRejection = (
  _reason: string,
  promise: Promise<unknown>
): void => {
  promise.catch((reason) => {
    Sentry.captureException(reason);
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
      err
    );
    process.exit(2);
  });
