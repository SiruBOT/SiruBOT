import { AudioHandler } from "./AudioHandler";
import { Player } from "shoukaku";
import { Logger } from "tslog";
import { PlayerDispatcher } from "./PlayerDispatcher";
import { IJoinOptions } from "../../types";
import { Client } from "../Client";

export class PlayerDispatcherFactory {
  public client: Client;
  constructor(client: Client) {
    this.client = client;
  }

  async createPlayerDispatcher(
    player: Player,
    joinOptions: IJoinOptions
  ): Promise<PlayerDispatcher> {
    const playerDispatcher = new PlayerDispatcher(
      this.client,
      player,
      joinOptions
    );
    playerDispatcher.registerPlayerEvent();
    this.client.log.info(
      `PlayerDispatcher successfully created @ ${player.connection.guildId}/${player.connection.channelId}`
    );
    return playerDispatcher;
  }
}
