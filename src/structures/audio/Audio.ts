import * as Sentry from "@sentry/node";
import { Shoukaku, Libraries, ShoukakuSocket, JoinOptions } from "shoukaku";
import { Client } from "../Client";
import { PlayerDispatcher } from "./PlayerDispatcher";
export class Audio extends Shoukaku {
  public client: Client;
  public dispatchers: Map<string, PlayerDispatcher>;
  constructor(client: Client) {
    super(new Libraries.DiscordJS(client), client.settings.audio.nodes, {});
    this.client = client;
    this.dispatchers = new Map<string, PlayerDispatcher>();

    this.on("ready", (name, resumed) =>
      this.client.log.info(
        `Lavalink Node: ${name} is now connected`,
        `This connection is ${resumed ? "resumed" : "a new connection"}`
      )
    );
    this.on("error", (name, error) => {
      this.client.log.error(error);
      Sentry.captureException(error, { tags: { node: name } });
    });
    this.on("close", (name, code, reason) =>
      this.client.log.info(
        `Lavalink Node: ${name} closed with code ${code}`,
        reason || "No reason"
      )
    );
    this.on("disconnect", (name, _players, moved) =>
      this.client.log.info(
        `Lavalink Node: ${name} disconnected`,
        moved ? "players have been moved" : "players have been disconnected"
      )
    );
    this.on("debug", (name, reason) =>
      this.client.log.debug(`Lavalink Node: ${name}`, reason || "No reason")
    );
  }

  async joinChannel(
    joinOptions: JoinOptions,
    localeString: string
  ): Promise<PlayerDispatcher> {
    const idealNode: ShoukakuSocket = this.getNode();
    const shoukakuPlayer = await idealNode.joinChannel(joinOptions);
    const dispatcher = new PlayerDispatcher(this, shoukakuPlayer, localeString);
    this.dispatchers.set(joinOptions.guildId, dispatcher);
    return dispatcher;
  }
}

// export interface JoinOptions {
//   guildId: Snowflake;
//   shardId: number;
//   channelId: Snowflake;
//   mute?: boolean;
//   deaf?: boolean;
// }
