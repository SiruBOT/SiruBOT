import { Shoukaku, Connectors, Constants, Node } from "shoukaku";
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
  TinyInfo,
} from "@/types/audio";
import { KafuuClient } from "@/structures";
import { PlayerDispatcher, PlayerDispatcherFactory } from "@/structures/audio";
import { EmbedFactory } from "@/utils/embed";
import { GuildAudioData } from "@/types/models/audio";

import { getReusableFormatFunction } from "@/locales";
import { Locale } from "discord.js";
import { RELATED_TRACKS_DURATION_OFFSET } from "@/constants/time";
import { calculateLevenshteinDistance } from "@/types/utils/algorithm";
import { AudioTimer } from "./AudioTimer";

export class AudioHandler extends Shoukaku {
  public client: KafuuClient;
  private log: Logger;
  private playerDispatcherFactory: PlayerDispatcherFactory;
  public dispatchers: Map<string, PlayerDispatcher>;
  public relatedScraper: Scraper;
  public routePlanner?: RoutePlanner;
  public audioTimer: AudioTimer;

  constructor(client: KafuuClient) {
    const devOptions = {
      resumeTimeout: 60000,
      moveOnDisconnect: true,
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
          },
    );
    this.client = client;
    this.log = this.client.log.getChildLogger({
      name: this.client.log.settings.name + "-" + AudioHandler.name,
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
    this.audioTimer = new AudioTimer(this.client, 60000);
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
    joinOptions: KafuuJoinOptions,
  ): Promise<PlayerDispatcher> {
    const idealNode = this.getNode();
    if (!idealNode) throw new Error("Ideal node not found");
    this.log.info(
      `Join channel #${joinOptions.channelId} with Node ${idealNode.name}`,
    );
    const shoukakuPlayer = await idealNode.joinChannel(joinOptions);
    const dispatcher =
      await this.playerDispatcherFactory.createPlayerDispatcher(
        shoukakuPlayer,
        joinOptions,
      );
    this.addPlayerDispatcher(joinOptions.guildId, dispatcher);
    await dispatcher.playOrResumeOrNothing();
    return dispatcher;
  }

  public addPlayerDispatcher(
    guildId: string,
    dispatcher: PlayerDispatcher,
  ): PlayerDispatcher {
    if (this.dispatchers.get(guildId)) {
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
      guildId,
      nowPlaying,
      position,
      queue.length,
      queue
        .filter((e) => !e.info.isStream)
        .map((e) => e.info.length)
        .reduce((a, b) => a + b, 0),
    );
  }

  public async getRelatedVideo(
    videoId: string,
  ): Promise<IRelatedVideo[] | null> {
    const scrapeResult: IRelatedVideo[] | null =
      await this.relatedScraper.scrape(videoId, this?.routePlanner);
    if (!scrapeResult || scrapeResult.length <= 0) return null;
    return scrapeResult;
  }

  // Time unit: seconds
  public async rankRelatedVideos(
    scrapeResults: IRelatedVideo[],
    playedYoutubeTracks: TinyInfo[],
  ): Promise<IRelatedVideo[]> {
    const penalties = new Map<string, number>();
    this.log.debug(
      "Rank related videos, playedYoutubeTracks: ",
      playedYoutubeTracks.length,
      " scrapeResult: ",
      scrapeResults.length,
    );
    const {
      duration: lastTrackDuration,
      title: lastTrackTitle,
      videoId: lastTrackVideoId,
    } = playedYoutubeTracks[
      playedYoutubeTracks?.length ? playedYoutubeTracks.length - 1 : 0
    ];

    for (const scrapedTrack of scrapeResults) {
      const { videoId, duration } = scrapedTrack;
      const playedTrack = playedYoutubeTracks.find(
        (e) => e.videoId === videoId,
      );
      let videoPenalty = penalties.get(videoId) ?? 0;
      // Duplicated track
      if (playedTrack) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const playedTrackDuration = playedTrack.duration;
        videoPenalty += 1;

        if (
          duration &&
          playedTrackDuration &&
          Math.abs(duration - playedTrackDuration) >
            RELATED_TRACKS_DURATION_OFFSET
        )
          videoPenalty += 2;
      }
      // Scraped track is too long
      if (
        duration &&
        lastTrackDuration &&
        Math.abs(duration - lastTrackDuration) >
          RELATED_TRACKS_DURATION_OFFSET / 1000 + lastTrackDuration
      ) {
        videoPenalty += 3;
      }
      penalties.set(videoId, videoPenalty);
    }
    // Sort by Levenshtein distance (Similar )
    // 일정 정도로 비슷한 threshold를 설정해야 할듯
    const sorted = scrapeResults
      .sort((a, b) => {
        if (
          calculateLevenshteinDistance(a.title, lastTrackTitle) >
          calculateLevenshteinDistance(b.title, lastTrackTitle)
        )
          return 1;
        else return -1;
      })
      .sort((a, b) => {
        const aPenalty = penalties.get(a.videoId) ?? 0;
        const bPenalty = penalties.get(b.videoId) ?? 0;
        return aPenalty - bPenalty;
      })
      .slice(0, 5);
    const logStr = sorted.map(
      (e, index) =>
        index +
        "|" +
        e.title +
        " / " +
        e.videoId +
        " / " +
        penalties.get(e.videoId),
    );

    this.log.debug(
      `\n----- Related video ranking for ${lastTrackVideoId} -----\n${logStr.join(
        "\n",
      )}\n----- End of related video ranking -----`,
    );
    return sorted;
  }

  public async fetchRelated(videoId: string): Promise<KafuuAudioTrack | null> {
    const idealNode = this.getNode();
    if (!idealNode) throw new Error("Ideal node not found");
    const searchResult = await idealNode.rest.resolve(videoId);
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

  private nodeInfo() {
    const nodeStatus = (name: string) => {
      const node = this.nodes.get(name);
      if (!node) return "연결 끊김 (10회 실패)";
      return ["연결 중", "연결됨", "연결 해제중", "연결 끊김"][node.state];
    };

    return this.client.settings.audio.nodes.reduce<{ [x: string]: string }>(
      (acc, nodeInfo) => {
        acc[nodeInfo.name] = nodeStatus(nodeInfo.name);
        return acc;
      },
      {},
    );
  }

  private reconnectNodes() {
    for (const nodeInfo of this.client.settings.audio.nodes) {
      const node = this.nodes.get(nodeInfo.name);
      if (!node) {
        this.log.info("Connect node -> " + nodeInfo.name);
        this.addNode({
          auth: nodeInfo.auth,
          name: nodeInfo.name,
          url: nodeInfo.url,
        });
      } else {
        if (node.state === Constants.State.DISCONNECTED) {
          this.log.info("Reconnect node -> " + nodeInfo.name);
          node.connect();
        }
      }
    }
  }

  private setupHandler() {
    this.on("ready", (name, resumed) => {
      this.log.info(
        `Lavalink Node: ${name} is now connected`,
        `This connection is ${resumed ? "resumed" : "a new connection"}`,
      );
      if (resumed) {
        this.log.info("Resuming players...");
      }
    });
    this.on("error", (name, error) => {
      this.log.error(error);
    });
    this.on("close", (name, code, reason) =>
      this.log.info(
        `Lavalink Node: ${name} closed with code ${code}`,
        reason || "No reason",
      ),
    );
    this.on("disconnect", (name, _players, moved) =>
      this.log.info(
        `Lavalink Node: ${name} disconnected`,
        moved ? "players have been moved" : "players have been disconnected",
      ),
    );
    this.on("debug", (name, reason) =>
      this.log.debug(`Lavalink Node: ${name}`, reason || "No reason"),
    );
  }
}
