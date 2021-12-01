import { NodeOptions } from "shoukaku/types";
interface ISettings {
  sentryDsn: string | null;
  shardArgs: string[];
  execArgv: string[];
  bot: {
    activity: {
      url: string;
      type: "STREAMING" | "LISTENING" | "WATCHING" | "PLAYING";
    };
    token: string;
    games: string[];
    gamesInterval: number;
    owners: string[];
  };
  webhook: {
    id: string;
    token: string;
  };
  audio: {
    searchResults: number;
    timeout: number;
    nodes: NodeOptions[];
    relatedRoutePlanner: {
      enabled: boolean;
      ipBlocks: string[];
      excludeIps: string[];
      retryCount: number;
    };
  };
}

export default ISettings;
