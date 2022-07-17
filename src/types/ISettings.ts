import { NodeOption } from "shoukaku";
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
    nodes: NodeOption[];
    relatedRoutePlanner?: {
      ipBlocks: string[];
      excludeIps: string[];
      retryCount: number;
    };
  };
  database: {
    mysql: {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    };
    mongodb: {
      url: string;
      username: string;
      password: string;
    };
    redis: {
      host: string;
      port: number;
      password: string;
    };
  };
}
