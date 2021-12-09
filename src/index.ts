import { version, name } from "../package.json";
import type { IBootStrapperArgs, ISettings, IGatewayResponse } from "./types";

import { ArgumentParser } from "argparse";
import { existsSync, readFileSync } from "fs";
import { Logger } from "tslog";
import { parse } from "yaml";
import { fetch, Response } from "undici";

import * as Cluster from "discord-hybrid-sharding";

// read file when file exists & file extension == .yaml
function readFile(path: string): string {
  if (!existsSync(path)) throw new Error(`File ${path} does not exist`);
  if (typeof path == "string" && !path.endsWith(".yaml"))
    throw new Error(`File ${path} is not a YAML file`);
  return readFileSync(path, "utf8");
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

async function boot() {
  const args: IBootStrapperArgs = parser.parse_args();

  const log: Logger = new Logger({
    name: "Bootstrap",
    minLevel: args.debug ? "debug" : "info",
  });

  const fatal = (err: Error): void => {
    log.fatal(err);
    process.exit(1);
  };

  process.on("uncaughtException", fatal);
  process.on("unhandledRejection", fatal);

  log.info(`${name} version: ${version}, log level: ${log.settings.minLevel}`);
  log.debug(
    `config file: ${args.config}, shard: ${
      args.shard ? "Auto sharding enabled" : "Auto sharding disabled"
    }, debug: ${
      args.debug ? "Debug logging enabled" : "Debug logging disabled"
    }`
  );
  log.debug(`Loading config from ${args.config}`);

  const fileContent: string = readFile(args.config);
  const parsedConfig: ISettings = parse(fileContent);

  if (args.shard) {
    log.info("Auto sharding enabled");
    try {
      const token: string = parsedConfig.bot.token;
      log.debug("Fetching shard count to Discord.");
      log.debug(`Using token [${token.padEnd(token.length - 5, "*")}]`);
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
      const gatewayJson = (await gatewayFetch.json()) as IGatewayResponse;
      log.info(`Shard count: ${gatewayJson.shards}`);
      log.debug("Gateway info", gatewayJson);
    } catch (err) {
      log.error(err);
    }
  }
}

boot();
