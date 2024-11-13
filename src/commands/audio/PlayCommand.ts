// Import Sentry, discord.js, undici, shoukaku
import * as Discord from "discord.js";
import { fetch } from "undici";
import { LavalinkResponse, Track } from "shoukaku";
// Import structures
import { BaseCommand, KafuuClient } from "@/structures";
import { PlayerDispatcher } from "@/structures/audio";
import { format, getReusableFormatFunction } from "@/locales";
// Import types
import {
  KafuuButtonContext,
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { KafuuAudioTrack } from "@/types/audio";
import { GuildAudioData } from "@/types/models/audio";
import { STRING_KEYS } from "@/types/locales";
// Import utils
import { isURL } from "@/utils/url";
import { formatTrack } from "@/utils/formatter";
import { EmbedFactory } from "@/utils/embed";
import { ExtendedEmbed } from "@/utils/embed";

import {
  AUTOCOMPLETE_MAX_RESULT,
  EMOJI_INBOX_TRAY,
  EMOJI_X,
} from "@/constants/message";
import { COMMAND_WARN_MESSAGE_EPHEMERAL } from "@/constants/events/InteractionCreateEvent";
import { BUTTON_AWAIT_TIMEOUT } from "@/constants/time";
import { VoiceConnectedGuildMemberVoiceState } from "@/types/member";

// Set Custom Id
const okButtonCustomId = "p_ok";
const noButtonCustomId = "p_cancel";

type CacheItem = {
  searchResult: LavalinkResponse;
  timeoutId: NodeJS.Timeout;
};

export default class PlayCommand extends BaseCommand {
  private playlistCache: Map<string, CacheItem>;
  constructor(client: KafuuClient) {
    const slashCommand = new Discord.SlashCommandBuilder()
      .setName("play")
      .setNameLocalizations({
        ko: "재생",
      })
      .setDescription("Play a track or playlist")
      .setDescriptionLocalizations({
        ko: "재생 목록이나 노래를 재생해요.",
      })
      .addStringOption((option) =>
        option
          .setName("query")
          .setNameLocalizations({
            ko: "검색어",
          })
          .setDescription("Query to search/play")
          .setDescriptionLocalizations({
            ko: "재생할 노래의 제목이나 URL을 입력해주세요.",
          })
          .setAutocomplete(true)
          .setRequired(true),
      )
      .addBooleanOption((option) =>
        option
          .setName("soundcloud")
          .setNameLocalizations({
            ko: "사운드클라우드",
          })
          .setDescription("Search query on soundcloud")
          .setDescriptionLocalizations({
            ko: "검색을 유튜브가 아닌 사운드클라우드에서 해요.",
          })
          .setRequired(false),
      );
    super({
      slashCommand,
      client,
      category: KafuuCommandCategory.MUSIC,
      permissions: [KafuuCommandPermission.EVERYONE],
      requirements:
        KafuuCommandFlags.AUDIO_NODE |
        KafuuCommandFlags.VOICE_SAME_CHANNEL |
        KafuuCommandFlags.LISTEN_STATUS |
        KafuuCommandFlags.VOICE_CONNECTED,
      botPermissions: ["SendMessages", "Connect", "Speak", "EmbedLinks"],
    });
    // Youtube playlist result cache.
    this.playlistCache = new Map<string, CacheItem>();
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext<true>): Promise<void> {
    // Handle play command
    const query: string = interaction.options.getString("query", true);
    // AutoComplete 값 없는 경우 required여도 빈 값이 넘어올 수 있음
    if (query.length <= 0) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content:
          "> " + format(interaction.locale, "PLAY_AUTOCOMPLETE_NO_QUERY"),
      });
      return;
    }
    // Join voice channel before playing
    if (!this.client.audio.hasPlayerDispatcher(interaction.guildId)) {
      const { voice }: { voice: VoiceConnectedGuildMemberVoiceState } =
        interaction.member;
      try {
        await this.client.audio.joinChannel({
          guildId: interaction.guildId,
          channelId: voice.channelId,
          shardId: interaction.guild?.shardId ? interaction.guild?.shardId : 0,
          textChannelId: interaction.channelId,
        });
      } catch (error) {
        await interaction.reply(format(interaction.locale, "FAILED_JOIN"));
      }
    }
    await interaction.reply(format(interaction.locale, "PLAY_SEARCHING"));
    // Get dispatcher
    const dispatcher: PlayerDispatcher =
      this.client.audio.getPlayerDispatcherOrfail(interaction.guildId);
    // Get ideal node, AudioNode 옵션이 true이기때문에 node 가 없을 수 없음
    const node = this.client.audio.getNode();
    if (!node) throw new Error("Ideal node not found");
    const soundCloud = interaction.options.getBoolean("soundcloud", false);
    const searchResult = await node.rest.resolve(
      isURL(query) ? query : (soundCloud ? "scsearch:" : "ytsearch:") + query,
    );
    if (!searchResult) throw new Error("Search result not found");
    // Search result
    switch (searchResult.loadType) {
      case "LOAD_FAILED":
        await interaction.editReply({
          content: format(interaction.locale, "LOAD_FAILED"),
        });
        break;
      case "NO_MATCHES":
        await interaction.editReply({
          content: format(interaction.locale, "NO_MATCHES"),
        });
        break;
      // Playlist Handle
      case "PLAYLIST_LOADED":
        // Only playlist url
        if (searchResult.playlistInfo?.selectedTrack === -1) {
          await interaction.editReply({
            content: format(
              interaction.locale,
              "PLAYLIST_ADD",
              searchResult.playlistInfo?.name ??
                format(interaction.locale, "UNKNOWN"),
              searchResult.tracks.length.toString(),
            ),
          });
          await dispatcher.addTracks(
            searchResult.tracks.map((e: Track) => {
              return {
                ...e,
                requestUserId: interaction.user.id,
                relatedTrack: false,
                repeated: false,
              };
            }),
          );
        } else {
          // Handles videoId with playlistId
          const guildAudioData: GuildAudioData =
            await dispatcher.queue.getGuildAudioData();
          // Selected track
          const selectedTrack: number =
            searchResult.playlistInfo.selectedTrack ?? 0;
          const track: Track = searchResult.tracks[selectedTrack as number];
          const trackCacheKey: string = interaction.id;
          // Will playing or Enqueued message
          const leftTracks = searchResult.tracks.length - selectedTrack;
          const enQueueState: string =
            this.willPlayingOrEnqueued(
              guildAudioData.nowPlaying,
              guildAudioData.queue.length,
            ) === "WILL_PLAYING"
              ? format(
                  interaction.locale,
                  "WILL_PLAYING",
                  formatTrack(track, {
                    streamString: format(interaction.locale, "LIVESTREAM"),
                  }),
                )
              : format(
                  interaction.locale,
                  "ENQUEUED_TRACK",
                  formatTrack(track, {
                    streamString: format(interaction.locale, "LIVESTREAM"),
                  }),
                  (guildAudioData.queue.length + 1).toString(),
                );
          // Create ActionRow
          const actionRow: Discord.ActionRowBuilder<Discord.ButtonBuilder> =
            new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(
                  this.getCustomId({
                    customId: okButtonCustomId,
                    executorId: interaction.user.id,
                    args: [trackCacheKey],
                  }),
                )
                .setEmoji(EMOJI_INBOX_TRAY)
                .setStyle(Discord.ButtonStyle.Secondary),
              new Discord.ButtonBuilder()
                .setCustomId(
                  this.getCustomId({
                    customId: noButtonCustomId,
                    executorId: interaction.user.id,
                  }),
                )
                .setEmoji(EMOJI_X)
                .setStyle(Discord.ButtonStyle.Secondary),
            );
          // Question message
          const promptMsg = await interaction.editReply({
            content: enQueueState,
            components: [actionRow],
            embeds: [
              EmbedFactory.createEmbed()
                .setTitle(format(interaction.locale, "PLAYLIST"))
                .setDescription(
                  format(
                    interaction.locale,
                    "INCLUDES_PLAYLIST",
                    leftTracks.toString(),
                  ),
                )
                .setTrackThumbnail(track),
            ],
          });
          // Prompt timeout
          const timeoutId = setTimeout(() => {
            this.client.log.debug(
              "Prompt interaction menu deleted, interaction timeout @ " +
                interaction.id,
            );
            this.playlistCache.delete(trackCacheKey);
            if (promptMsg.editable)
              promptMsg.edit({ components: [], embeds: [] });
          }, BUTTON_AWAIT_TIMEOUT);
          this.playlistCache.set(trackCacheKey, { searchResult, timeoutId });
          // Add selected track without playlist
          await dispatcher.addTrack({
            ...track,
            requestUserId: interaction.user.id,
            relatedTrack: false,
            repeated: false,
          });
        }
        break;
      // Enqueue first of search result or track
      case "SEARCH_RESULT":
      case "TRACK_LOADED":
        const guildAudioData: GuildAudioData =
          await dispatcher.queue.getGuildAudioData();
        const addTo: KafuuAudioTrack = {
          requestUserId: interaction.user.id,
          ...searchResult.tracks[0],
          relatedTrack: false,
          repeated: false,
        };
        const trackEmbed: ExtendedEmbed = await EmbedFactory.getTrackEmbed(
          this.client,
          getReusableFormatFunction(interaction.locale),
          addTo,
        );
        await interaction.editReply({
          content: format(
            interaction.locale,
            (this.willPlayingOrEnqueued(
              guildAudioData.nowPlaying,
              guildAudioData.queue.length,
            ) + "_TITLE") as STRING_KEYS,
            (guildAudioData.queue.length + 1).toString(),
          ),
          embeds: [trackEmbed],
        });
        await dispatcher.addTrack(addTo);
        break;
    }
  }

  private willPlayingOrEnqueued(
    nowplaying: KafuuAudioTrack | null,
    queueLength: number,
  ): string {
    const localeKey: string =
      !nowplaying && queueLength === 0 ? "WILL_PLAYING" : "ENQUEUED_TRACK";
    return localeKey;
  }

  public override async onButtonInteraction(
    context: KafuuButtonContext,
  ): Promise<void> {
    const { interaction, customInfo } = context;
    if (!interaction.guildId) return;
    switch (customInfo.customId) {
      case okButtonCustomId:
        const trackCacheKey = customInfo.args?.[0] ?? null;
        const cachedResult = trackCacheKey
          ? this.playlistCache.get(trackCacheKey)
          : null;
        if (!cachedResult) {
          await interaction.update({
            content: format(interaction.locale, "EXPIRED_INTERACTION"),
            components: [],
            embeds: [],
          });
          return;
        } else if (trackCacheKey) {
          // Clear cache, clear timeout
          this.playlistCache.delete(trackCacheKey);
          clearTimeout(cachedResult.timeoutId);
        }
        // Slice tracks after selected track position
        const slicedPlaylist: Track[] = cachedResult.searchResult.tracks.slice(
          cachedResult.searchResult.playlistInfo.selectedTrack ?? 0, // Array starts 0
          cachedResult.searchResult.tracks.length,
        );
        const dispatcher = this.client.audio.dispatchers.get(
          interaction.guildId,
        );
        if (!dispatcher) {
          await interaction.update({
            components: [],
            embeds: [],
          });
          return;
        }
        // Update successfully added message
        await interaction.update({
          components: [],
          embeds: [
            EmbedFactory.createEmbed()
              .setTitle(format(interaction.locale, "PLAYLIST"))
              .setDescription(
                format(
                  interaction.locale,
                  "PLAYLIST_ADDED_NOEMOJI",
                  cachedResult.searchResult.playlistInfo?.name ??
                    format(interaction.locale, "UNKNOWN"),
                  slicedPlaylist.length.toString(),
                ),
              )
              .setTrackThumbnail(cachedResult.searchResult.tracks[0]),
          ],
        });
        // Add sliced playlist
        await dispatcher.addTracks(
          slicedPlaylist.map((e: Track) => {
            return {
              ...e,
              requestUserId: interaction.user.id,
              relatedTrack: false,
              repeated: false,
            };
          }),
        );
        break;
      case noButtonCustomId:
        await interaction.update({
          components: [],
          embeds: [],
        });
    }
  }

  public override async onAutocompleteInteraction(
    interaction: Discord.AutocompleteInteraction<Discord.CacheType>,
  ): Promise<void> {
    const soundCloud = interaction.options.getBoolean("soundcloud", false);
    const query: string | null = interaction.options.getString("query");
    if (!query) {
      await interaction.respond([
        {
          name: format(interaction.locale, "PLAY_AUTOCOMPLETE_NO_QUERY"),
          value: "",
        },
      ]);
      return;
    }
    if (!soundCloud) {
      // Response structure
      // [][0] -> query input
      // [][1] -> suggestions[]
      // [][2] -> ?
      interface YTSuggestResponse {
        [index: number]: string | string[];
        0: string;
        1: string[];
      }
      const ytAutocomplete = (await fetch(
        "https://suggestqueries-clients6.youtube.com/complete/search?client=firefox&ds=yt&xhr=t&q=" +
          query,
        {
          method: "GET",
          headers: {
            "Content-Type": "text/plain; charset=UTF-8",
          },
        },
      ).then((res) => res.json())) as YTSuggestResponse;

      if (!ytAutocomplete?.[1]) {
        await interaction.respond([]);
        return;
      }

      await interaction.respond(
        ytAutocomplete[1]
          .map((name) => {
            return {
              name: name.length > 100 ? name.slice(0, 90) + "..." : name,
              value: name.length > 100 ? name.slice(0, 90) + "..." : name,
            };
          })
          .slice(0, AUTOCOMPLETE_MAX_RESULT),
      );
      return;
    } else {
      // SoundCloud Autocomplete handle
      const idealNode = this.client.audio.getNode();
      // 노드가 없다면 결과없음 반환
      if (!idealNode) return await interaction.respond([]);
      const searchResult = await idealNode.rest.resolve("scsearch:" + query);
      // Search가 아니거나 검색 결과가 null 일 경우 결과 없음.
      // TODO 플레이리스트일경우 플레이리스트 추가, 한곡 추가, 등등, URL일경우 URL 정보 표시해주기
      if (!searchResult || searchResult.loadType !== "SEARCH_RESULT") {
        await interaction.respond([]);
        return;
      }
      await interaction.respond(
        searchResult.tracks
          .map((v: Track) => {
            return {
              name: v.info.title
                ? v.info.title.length > 100
                  ? v.info.title.slice(0, 90) + "..."
                  : v.info.title
                : "N/A",
              value: v.info.uri ?? query.slice(0, 100),
            };
          })
          .slice(0, AUTOCOMPLETE_MAX_RESULT),
      );
      return;
    }
  }
}
