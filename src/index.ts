import { Logger } from "tslog";
import { ArgumentParser } from "argparse";
import type { IBootStrapperArgs } from "./types";

const parser: ArgumentParser = new ArgumentParser({
  description: "SiruBOT BootStrapper CLI",
});

const log: Logger = new Logger({ name: "BootStrap" });

parser.add_argument("-s", "--shard", {
  help: "Enable auto sharding",
  default: false,
});

const args: IBootStrapperArgs = parser.parse_args();

if (args.shard === "auto") {
  log.info("Sharding enabled");
}