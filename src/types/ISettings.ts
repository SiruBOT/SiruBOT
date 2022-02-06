import { NodeOptions } from "shoukaku/types";
export interface ISettings {
  sentryDsn?: string;
  bot: {
    shardsPerClusters: number;
    activity: {
      url?: string;
      type: "STREAMING" | "LISTENING" | "WATCHING" | "PLAYING";
    };
    token: string;
    playing: string;
    owners: string[];
  };
  webhook?: {
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
  database: {
    mysql: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
    mongodb: {
      url: string;
      user: string;
      pass: string;
    };
    redis: {
      host: string;
      port: number;
      password: string;
    };
  };
}
