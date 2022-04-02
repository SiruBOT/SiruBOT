import { AudioHandler } from "./AudioHandler";
import { ShoukakuPlayer } from "shoukaku";
import { Logger } from "tslog";
import { PlayerDispatcher } from "./PlayerDispatcher";
import { IJoinOptions } from "../../types";

export class PlayerDispatcherFactory {
  public audio: AudioHandler;
  private log: Logger;
  constructor(audio: AudioHandler) {
    this.audio = audio;
    this.log = this.audio.getLoggerInstance();
  }

  async createPlayerDispatcher(
    player: ShoukakuPlayer,
    joinOptions: IJoinOptions
  ): Promise<PlayerDispatcher> {
    const databaseHelper = this.audio.client.databaseHelper;
    const playerDispatcher = new PlayerDispatcher(
      this.audio,
      player,
      databaseHelper,
      joinOptions
    );
    playerDispatcher.registerPlayerEvent();
    this.log.debug(
      `PlayerDispatcher successfully created @ ${player.connection.guildId}/${player.connection.channelId}`
    );
    return playerDispatcher;
  }
}
