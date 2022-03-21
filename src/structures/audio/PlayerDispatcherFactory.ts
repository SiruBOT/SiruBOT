import { AudioHandler } from "./AudioHandler";
import { Client } from "../Client";
import { ShoukakuPlayer } from "shoukaku";
import { Logger } from "tslog";
import { PlayerDispatcher } from "./PlayerDispatcher";

export class PlayerDispatcherFactory {
  public audio: AudioHandler;
  public client: Client;
  private log: Logger;
  constructor(audio: AudioHandler) {
    this.audio = audio;
    this.log = this.audio.getLoggerInstance();
  }

  async createPlayerDispatcher(
    player: ShoukakuPlayer,
    textChannelId: string
  ): Promise<PlayerDispatcher> {
    const databaseHelper = this.audio.client.databaseHelper;
    const playerDispatcher = new PlayerDispatcher(
      this.audio,
      player,
      databaseHelper,
      textChannelId
    );
    playerDispatcher.registerPlayerEvent();
    this.log.debug(
      `PlayerDispatcher successfully created @ ${player.connection.guildId}/${player.connection.channelId}`
    );
    return playerDispatcher;
  }
}
