import type { NodeStats } from "shoukaku";

export interface AudioNodeStats {
  name: string;
  players: number;
  usageByDispatchers: number;
  state: string;
  reconnects: number;
  stats: NodeStats | null;
}

export interface ClientStats {
  shardIds: number[];
  discordStats: {
    cachedGuilds: number;
    cachedUsers: number;
    cachedChannels: number;
  };
  audioStats: {
    audioDispatchers: number;
    audioNodes: AudioNodeStats[];
  };
  websocketStatus: {
    wsStatus: number;
    wsLatency: number;
  };
}
