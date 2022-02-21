import { Audio } from "./Audio";
import { Client } from "../Client";
import { Queue } from "./Queue";
import { ShoukakuPlayer } from "shoukaku";
import locale from "../../locales";
import { Logger } from "tslog";

export class PlayerDispatcher {
  public audio: Audio;
  public client: Client;
  private log: Logger;
  private localeString: string;
  private queue: Queue;
  private player: ShoukakuPlayer;
  constructor(audio: Audio, player: ShoukakuPlayer, localeString: string) {
    this.audio = audio;
    this.client = audio.client;
    this.log = this.client.log.getChildLogger({
      name: this.client.log.settings.name,
    });
    this.localeString = localeString;
    this.player = player;
    this.queue = new Queue(this.log, this);

    this.log.info(
      `PlayerDispatcher created @ ${this.player.connection.guildId}/${this.player.connection.channelId}`
    );
  }
}
