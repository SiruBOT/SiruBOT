import { Player } from "shoukaku";
import { PlayerDispatcher } from "./PlayerDispatcher";
import { KafuuJoinOptions } from "@/types/audio";
import { KafuuClient } from "@/structures";

export class PlayerDispatcherFactory {
  public client: KafuuClient;
  constructor(client: KafuuClient) {
    this.client = client;
  }

  async createPlayerDispatcher(
    player: Player,
    joinOptions: KafuuJoinOptions,
  ): Promise<PlayerDispatcher> {
    const playerDispatcher = new PlayerDispatcher(
      this.client,
      player,
      joinOptions,
    );
    this.client.log.info(
      `PlayerDispatcher successfully created @ ${player.guildId}/${joinOptions.channelId}`,
    );
    return playerDispatcher;
  }
}
