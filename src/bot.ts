import Discord from "discord.js";
import Cluster from "discord-hybrid-sharding";

import { Client } from "./structures";
import type { ISettings, IBootStrapperArgs } from "./types";

const argvSettings: ISettings = JSON.parse(process.argv[2]);
const bootStrapperArgs: IBootStrapperArgs = JSON.parse(process.argv[3]);
const intents: Discord.Intents = new Discord.Intents([
  "GUILD_MEMBERS",
  "GUILDS",
]);

const clientOptions: Discord.ClientOptions = {
  intents,
};

if (bootStrapperArgs.shard) {
  // @ts-expect-error Cluster.data.SHARD_LIST is will after bot is spawned
  clientOptions.shards = Cluster.data.SHARD_LIST; //  A Array of Shard list, which will get spawned
  // @ts-expect-error Cluster.data.TOTAL_SHARDS is will after bot is spawned
  clientOptions.shardCount = Cluster.data.TOTAL_SHARDS; // The Number of Total Shards
}

const client = new Client(clientOptions, argvSettings);

if (bootStrapperArgs.shard) {
  client.cluster = new Cluster.Client(client);
}

client.start();
