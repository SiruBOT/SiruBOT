import { ILogObject, Logger, TLogLevelName } from "tslog";
import { createStream } from "rotating-file-stream";
import { join } from "path";
type ShardInfo = {
  clusterId: number;
  shardIds: number[];
  totalShards: number;
};

export function createLogger({
  name,
  shardInfo,
  consoleLevel,
}: {
  name: string;
  shardInfo?: ShardInfo;
  consoleLevel: TLogLevelName;
}) {
  const stream = createStream(
    join(
      "logs",
      `${name.toLowerCase()}`,
      `kafuu-${name.toLowerCase()}-${new Date().getTime()}.log`,
    ),
    {
      size: "10M",
      interval: "1d",
      compress: "gzip",
    },
  );

  const writeTransport = (logObj: ILogObject) => {
    stream.write(JSON.stringify(logObj) + "\n");
  };

  const logger = new Logger({
    name: name,
    minLevel: consoleLevel,
  });
  logger.attachTransport(
    {
      debug: writeTransport,
      error: writeTransport,
      fatal: writeTransport,
      info: writeTransport,
      silly: writeTransport,
      trace: writeTransport,
      warn: writeTransport,
    },
    "debug",
  );

  return logger;
}
