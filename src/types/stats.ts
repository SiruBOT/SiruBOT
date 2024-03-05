import type { NodeInfo, NodeStats } from "shoukaku";

export type AudioNodeStats = {
  stats: NodeStats | null;
  info: NodeInfo | null;
};

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
