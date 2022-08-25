import * as Sentry from "@sentry/node";
import { Shoukaku, Connectors } from "shoukaku";
import { Logger } from "tslog";
import { IJoinOptions } from "../../types/audio/IJoinOptions";
import { Client } from "../Client";
import { PlayerDispatcher } from "./PlayerDispatcher";
import { PlayerDispatcherFactory } from "./PlayerDispatcherFactory";
import {
  IRelatedVideo,
  RoutePlanner,
  Scraper,
} from "@sirubot/yt-related-scraper";
import { IAudioTrack, IGuildAudioData, PlayingState } from "../../types";
import { EmbedFactory } from "../../utils";
import { Guild } from "../../database/mysql/entities";
import locale from "../../locales";

export class AudioHandler extends Shoukaku {
  public client: Client;
  private log: Logger;
  private playerDispatcherFactory: PlayerDispatcherFactory;
  public dispatchers: Map<string, PlayerDispatcher>;
  public relatedScraper: Scraper;
  public routePlanner?: RoutePlanner;

  constructor(client: Client) {
    super(new Connectors.DiscordJS(client), client.settings.audio.nodes, {
      resumeTimeout: 60000,
      moveOnDisconnect: true,
      reconnectTries: 10,
    });
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
    this.playerDispatcherFactory = new PlayerDispatcherFactory(this);
    this.setupEvents();
  }

  public getPlayingState(guildId: string): PlayingState {
    const dispatcher: PlayerDispatcher | undefined =
      this.dispatchers.get(guildId);
    if (dispatcher && dispatcher.player.track) {
      if (dispatcher.player.paused) return PlayingState.PAUSED;
      else return PlayingState.PLAYING;
    } else {
      return PlayingState.NOTPLAYING;
    }
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
    joinOptions: IJoinOptions
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
    await dispatcher.playOrResumeOrNothing();
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

  public async getNowPlayingEmbed(guildId: string, localeName?: string) {
    const { guildLocale }: Guild =
      await this.client.databaseHelper.upsertAndFindGuild(guildId);
    const { nowPlaying, position, queue }: IGuildAudioData =
      await this.client.databaseHelper.upsertGuildAudioData(guildId);
    return await EmbedFactory.buildNowplayingEmbed(
      this.client,
      locale.getReusableFormatFunction(localeName ?? guildLocale),
      nowPlaying,
      position,
      queue.length,
      queue
        .filter((e) => !e.track.info.isStream)
        .map((e) => e.track.info.length)
        .reduce((a, b) => a + b, 0)
    );
  }

  public async getRelatedVideo(videoId: string): Promise<IAudioTrack | null> {
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
      requesterUserId: this.client.isReady() ? this.client.user.id : "",
      relatedTrack: true,
      repeated: false,
      track,
    };
  }

  private setupEvents() {
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

  public getLoggerInstance(): Logger {
    return this.log;
  }
}
