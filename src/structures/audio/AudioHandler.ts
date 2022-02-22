import * as Sentry from "@sentry/node";
import { Shoukaku, Libraries, ShoukakuSocket, JoinOptions } from "shoukaku";
import { Logger } from "tslog";
import { Client } from "../Client";
import { PlayerDispatcher } from "./PlayerDispatcher";
import { PlayerDispatcherFactory } from "./PlayerDispatcherFactory";
export class AudioHandler extends Shoukaku {
  public client: Client;
  private log: Logger;
  private playerDispatcherFactory: PlayerDispatcherFactory;
  public dispatchers: Map<string, PlayerDispatcher>;
  constructor(client: Client) {
    super(new Libraries.DiscordJS(client), client.settings.audio.nodes, {});
    this.client = client;
    this.log = this.client.log.getChildLogger({
      name: this.client.log.settings.name,
    });
    this.dispatchers = new Map<string, PlayerDispatcher>();
    this.playerDispatcherFactory = new PlayerDispatcherFactory(this);

    this.on("ready", (name, resumed) =>
      this.log.info(
        `Lavalink Node: ${name} is now connected`,
        `This connection is ${resumed ? "resumed" : "a new connection"}`
      )
    );
    this.on("error", (name, error) => {
      this.log.error(error);
      Sentry.captureException(error, { tags: { node: name } });
    });
    this.on("close", (name, code, reason) =>
      this.log.info(
        `Lavalink Node: ${name} closed with code ${code}`,
        reason || "No reason"
      )
    );
    this.on("disconnect", (name, _players, moved) =>
      this.log.info(
        `Lavalink Node: ${name} disconnected`,
        moved ? "players have been moved" : "players have been disconnected"
      )
    );
    this.on("debug", (name, reason) =>
      this.log.debug(`Lavalink Node: ${name}`, reason || "No reason")
    );
  }

  async joinChannel(
    joinOptions: JoinOptions,
    localeString: string
  ): Promise<PlayerDispatcher> {
    const idealNode: ShoukakuSocket = this.getNode();
    const shoukakuPlayer = await idealNode.joinChannel(joinOptions);
    const dispatcher =
      await this.playerDispatcherFactory.createPlayerDispatcher(
        shoukakuPlayer,
        localeString
      );
    this.addPlayerDispatcher(joinOptions.guildId, dispatcher);
    return dispatcher;
  }

  getLogger(): Logger {
    return this.log;
  }

  addPlayerDispatcher(guildId: string, dispatcher: PlayerDispatcher) {
    if (this.dispatchers.get(guildId)) {
      Sentry.captureMessage(
        "AudioHandler is already exists in PlayerDispatcher."
      );
      this.log.warn("AudioHandler is already exists in PlayerDispatcher.");
    }
    return this.dispatchers.set(guildId, dispatcher);
  }
}

// export interface JoinOptions {
//   guildId: Snowflake;
//   shardId: number;
//   channelId: Snowflake;
//   mute?: boolean;
//   deaf?: boolean;
// }
