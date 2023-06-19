import * as Sentry from "@sentry/node";
import { Shoukaku, Connectors } from "shoukaku";
import { Logger } from "tslog";

import {
  IRelatedVideo,
  RoutePlanner,
  Scraper,
} from "@sirubot/yt-related-scraper";

import {
  KafuuAudioTrack,
  KafuuJoinOptions,
  KafuuPlayingState,
} from "@/types/audio";
import { KafuuClient } from "@/structures";
import { PlayerDispatcher, PlayerDispatcherFactory } from "@/structures/audio";
import { EmbedFactory } from "@/utils/embed";
import { GuildAudioData } from "@/types/models/audio";

import { getReusableFormatFunction } from "@/locales";
import { Locale } from "discord.js";

export class AudioHandler extends Shoukaku {
  public client: KafuuClient;
  private log: Logger;
  private playerDispatcherFactory: PlayerDispatcherFactory;
  public dispatchers: Map<string, PlayerDispatcher>;
  public relatedScraper: Scraper;
  public routePlanner?: RoutePlanner;

  constructor(client: KafuuClient) {
    const devOptions = {
      resumeTimeout: 60000,
      moveOnDisconnect: true,
      reconnectTries: 10,
      resume: true,
      resumeByLibrary: true,
      resumeKey: `resumeKey-${client.user?.id}`,
      alwaysSendResumeKey: true,
    };
    super(
      new Connectors.DiscordJS(client),
      client.settings.audio.nodes,
      process.env.NODE_ENV === "development"
        ? devOptions
        : {
            moveOnDisconnect: true,
            reconnectTries: 10,
          }
    );
    this.client = client;
    this.log = this.client.log.getChildLogger({
      name: this.client.log.settings.name,
    });
    const { relatedRoutePlanner } = client.settings.audio;
    if (relatedRoutePlanner) {
      const { ipBlocks, excludeIps } = relatedRoutePlanner;
      this.routePlanner = new RoutePlanner({
        ipBlocks,
        excludeIps,
        log: this.log,
      });
    }
    this.relatedScraper = new Scraper({ log: this.log });
    this.dispatchers = new Map<string, PlayerDispatcher>();
    this.playerDispatcherFactory = new PlayerDispatcherFactory(this.client);
    this.setupHandler();
  }

  public playingState(guildId: string): KafuuPlayingState {
    const dispatcher: PlayerDispatcher | undefined =
      this.dispatchers.get(guildId);
    if (dispatcher?.player.track) {
      return dispatcher.player.paused
        ? KafuuPlayingState.PAUSED
        : KafuuPlayingState.PLAYING;
    }
    return KafuuPlayingState.NOTPLAYING;
  }

  public getPlayerDispatcher(guildId: string): PlayerDispatcher | null {
    return this.dispatchers.get(guildId) ?? null;
  }

  public getPlayerDispatcherOrfail(guildId: string): PlayerDispatcher {
    const dispatcher: PlayerDispatcher | undefined =
      this.dispatchers.get(guildId);
    if (!dispatcher)
      throw new Error(`PlayerDispatcher not found on ${guildId}`);
    return dispatcher;
  }

  public hasPlayerDispatcher(guildId: string): boolean {
    return this.dispatchers.has(guildId);
  }

  public async joinChannel(
    joinOptions: KafuuJoinOptions
  ): Promise<PlayerDispatcher> {
    const idealNode = this.getNode();
    if (!idealNode) throw new Error("Ideal node not found");
    this.log.debug(
      `Join channel #${joinOptions.channelId} with Node ${idealNode.name}`
    );
    const shoukakuPlayer = await idealNode.joinChannel(joinOptions);
    const dispatcher =
      await this.playerDispatcherFactory.createPlayerDispatcher(
        shoukakuPlayer,
        joinOptions
      );
    this.addPlayerDispatcher(joinOptions.guildId, dispatcher);
    // await dispatcher.playOrResumeOrNothing();;
    return dispatcher;
  }

  public addPlayerDispatcher(
    guildId: string,
    dispatcher: PlayerDispatcher
  ): PlayerDispatcher {
    if (this.dispatchers.get(guildId)) {
      Sentry.captureMessage(
        "PlayerDispatcher is already exists in AudioHandler"
      );
      this.log.warn("PlayerDispatcher is already exists in AudioHandler");
    }
    this.dispatchers.set(guildId, dispatcher);
    return dispatcher;
  }

  public deletePlayerDispatcher(guildId: string): string {
    if (!this.dispatchers.get(guildId))
      throw new Error(`PlayerDispatcher ${guildId} is not exists.`);
    this.dispatchers.delete(guildId);
    return guildId;
  }

  public async getNowPlayingEmbed(guildId: string, localeName?: Locale) {
    const { nowPlaying, position, queue }: GuildAudioData =
      await this.client.databaseHelper.upsertGuildAudioData(guildId);
    return await EmbedFactory.buildNowplayingEmbed(
      this.client,
      getReusableFormatFunction(localeName ?? Locale.Korean),
      nowPlaying,
      position,
      queue.length,
      queue
        .filter((e) => !e.info.isStream)
        .map((e) => e.info.length)
        .reduce((a, b) => a + b, 0)
    );
  }

  public async getRelatedVideo(
    videoId: string
  ): Promise<KafuuAudioTrack | null> {
    const scrapeResult: IRelatedVideo[] | null =
      await this.relatedScraper.scrape(videoId, this?.routePlanner);
    if (!scrapeResult || scrapeResult.length <= 0) return null;
    const idealNode = this.getNode();
    if (!idealNode) throw new Error("Ideal node not found");
    const searchResult = await idealNode.rest.resolve(scrapeResult[0].videoId);
    if (
      !searchResult ||
      ["LOAD_FAILED", "NO_MATCHES"].includes(searchResult?.loadType)
    )
      return null;
    const track = searchResult.tracks.at(0);
    if (!track) return null;
    return {
      requestUserId: this.client.isReady() ? this.client.user.id : "",
      relatedTrack: true,
      repeated: false,
      ...track,
    };
  }

  private setupHandler() {
    this.on("ready", (name, resumed) => {
      this.log.info(
        `Lavalink Node: ${name} is now connected`,
        `This connection is ${resumed ? "resumed" : "a new connection"}`
      );
      if (resumed) {
        this.log.info("Resuming players...");
      }
    });
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

  private resumePlayers(): void {
    // Query updatedAt < 1min ago
    // Testing Stuff
    if (process.env.NODE_ENV == "development") {
      this.joinChannel({
        channelId: "1096224923120324741",
        shardId: 0,
        guildId: "1096224922226933862",
        textChannelId: "1100985233068806174",
      });
    }
  }
}
