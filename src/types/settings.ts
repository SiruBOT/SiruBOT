import type { NodeOption } from "shoukaku";
import { stat, readFile } from "fs/promises";

// Define the interface for KafuuSettings
export interface KafuuSettings {
  sentryDsn?: string; // Optional Sentry DSN string
  bot: {
    shardsPerClusters: number; // Number of shards per cluster
    activity: {
      url?: string; // Optional URL string
      type: "STREAMING" | "LISTENING" | "WATCHING" | "PLAYING"; // Activity type
    };
    token: string; // Bot token string
    playing: string; // Playing status string
    owners: string[]; // Array of bot owners' IDs
  };
  webhook?: {
    id: string; // Webhook ID string
    token: string; // Webhook token string
  };
  audio: {
    searchResults: number; // Number of search results
    timeout: number; // Timeout in milliseconds
    nodes: NodeOption[]; // Array of NodeOption objects
    relatedRoutePlanner?: {
      // Optional related route planner object
      ipBlocks: string[]; // Array of IP blocks
      excludeIps: string[]; // Array of excluded IPs
      retryCount: number; // Number of retries
    };
  };
  database: {
    mysql: {
      host: string; // MySQL host string
      port: number; // MySQL port number
      username: string; // MySQL username string
      password: string; // MySQL password string
      database: string; // MySQL database string
    };
    mongodb: {
      url: string; // MongoDB URL string
      username: string; // MongoDB username string
      password: string; // MongoDB password string
    };
  };
}

// fs.exists is deprecated
async function exists(path: string): Promise<boolean> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await stat(path);
    return true;
  } catch (err) {
    return false;
  }
}

export async function safeReadFile(path: string): Promise<string> {
  const fileExists = await exists(path);
  if (!fileExists) throw new Error(`File ${path} does not exist`);
  if (typeof path == "string" && !path.endsWith(".yaml"))
    throw new Error(`File ${path} is not a YAML file`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return readFile(path, "utf-8");
}
