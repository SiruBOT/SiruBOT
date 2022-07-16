import { SlashCommandBuilder } from "@discordjs/builders";
import * as Sentry from "@sentry/node";
import * as Discord from "discord.js";
import LRU from "lru-cache";
import { Node, Track, LavalinkResponse } from "shoukaku";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  IAudioTrack,
  ICommandContext,
  IGuildAudioData,
  ShoukakuTrackListType,
  VoiceConnectedGuildMemberVoiceState,
} from "../../types";
import locale from "../../locales";
import { isURL, Formatter, EmbedFactory } from "../../utils";
import { PlayerDispatcher } from "../../structures/audio/PlayerDispatcher";
import { AudioTools } from "../../structures/audio/AudioTools";
import {
  AUTOCOMPLETE_MAX_RESULT,
  EMOJI_INBOX_TRAY,
  EMOJI_X,
} from "../../constant/MessageConstant";
import { BUTTON_AWAIT_TIMEOUT } from "../../constant/TimeConstant";
import { ExtendedEmbed } from "../../utils/ExtendedEmbed";
import { MessageUtil } from "../../utils/MessageUtil";

const commandRequirements = {
  audioNode: true,
  trackPlaying: false,
  voiceStatus: {
    listenStatus: true,
    sameChannel: false, // false or true
    voiceConnected: true,
  },
} as const;

export default class PlayCommand extends BaseCommand {
  // Autocomplete URL -> Playcommand cache, short ttl
  private searchCache: LRU<string, LavalinkResponse> = new LRU({
    ttl: 1000 * 30, // 30 seconds
    max: 100, // Max items
    updateAgeOnGet: true, // extend ttl on get
  });
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("play")
      .setDescription("노래나 재생 목록을 재생해요")
      .addStringOption((option) =>
        option
          .setName("query")
          .setDescription("노래 검색어")
          .setAutocomplete(true)
          .setRequired(true)
      );
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
      commandRequirements,
      ["SEND_MESSAGES", "CONNECT", "SPEAK", "EMBED_LINKS"]
    );
  }

  public async runCommand(
    { interaction }: ICommandContext<typeof commandRequirements>,
    soundCloud = false
  ): Promise<void> {
    await interaction.deferReply();
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
        // Handle joinChannel exception
        const exceptionId: string = Sentry.captureException(error);
        await interaction.editReply(
          locale.format(interaction.locale, "FAILED_JOIN", exceptionId)
        );
      }
    }

    // Handle play command
    const query: string = interaction.options.getString("query", true);
    // Get dispatcher
    const dispatcher: PlayerDispatcher = this.client.audio.getPlayerDispatcher(
      interaction.guildId
    );
    // Get ideal node, AudioNode 옵션이 true이기때문에 node 가 없을 수 없음
    const node = this.client.audio.getNode();
    if (!node) throw new Error("Ideal node not found");
    const searchResult = await this.fetchTracksCached(
      node,
      isURL(query) ? query : (soundCloud ? "scsearch:" : "ytsearch:") + query
    );
    if (!searchResult) throw new Error("Search result not found");
    // Search result
    switch (searchResult.loadType) {
      case "LOAD_FAILED":
        await MessageUtil.followUpOrEditReply(interaction, {
          content: locale.format(interaction.locale, "LOAD_FAILED"),
        });
        break;
      case "NO_MATCHES":
        await MessageUtil.followUpOrEditReply(interaction, {
          content: locale.format(interaction.locale, "NO_MATCHES"),
        });
        break;
      // Playlist Handle
      case "PLAYLIST_LOADED":
        // Only playlist url
        if (searchResult.playlistInfo?.selectedTrack === -1) {
          await MessageUtil.followUpOrEditReply(interaction, {
            content: locale.format(
              interaction.locale,
              "PLAYLIST_ADD",
              searchResult.playlistInfo?.name ??
                locale.format(interaction.locale, "UNKNOWN"),
              searchResult.tracks.length.toString()
            ),
          });
          await dispatcher.addTracks(
            searchResult.tracks.map((e: Track) =>
              AudioTools.getAudioTrack(e, interaction.user.id)
            )
          );
        } else {
          // Handles videoId with playlistId
          const guildAudioData: IGuildAudioData =
            await dispatcher.queue.getGuildAudioData();
          // Selected track
          const selectedTrack: number =
            searchResult.playlistInfo.selectedTrack ?? 0;
          // eslint-disable-next-line security/detect-object-injection
          const track: Track = searchResult.tracks[selectedTrack];
          // Slice tracks after selected track position
          const slicedPlaylist: Track[] = searchResult.tracks.slice(
            selectedTrack + 1, // Array starts 0
            searchResult.tracks.length
          );
          // Will playing or Enqueued message
          const enQueueState: string =
            this.willPlayingOrEnqueued(
              guildAudioData.nowPlaying,
              guildAudioData.queue.length
            ) === "WILL_PLAYING"
              ? locale.format(
                  interaction.locale,
                  "WILL_PLAYING",
                  Formatter.formatTrack(
                    track,
                    locale.format(interaction.locale, "LIVESTREAM")
                  )
                )
              : locale.format(
                  interaction.locale,
                  "ENQUEUED_TRACK",
                  Formatter.formatTrack(
                    track,
                    locale.format(interaction.locale, "LIVESTREAM")
                  ),
                  (guildAudioData.queue.length + 1).toString()
                );
          // Set Custom Id
          const okButtonCustomId = "play_command_playlist_ok";
          const noButtonCustomId = "play_command_playlist_cancel";
          // Create ActionRow
          const actionRow: Discord.MessageActionRow =
            new Discord.MessageActionRow().addComponents(
              new Discord.MessageButton()
                .setCustomId(okButtonCustomId)
                .setEmoji(EMOJI_INBOX_TRAY)
                .setStyle("SECONDARY"),
              new Discord.MessageButton()
                .setCustomId(noButtonCustomId)
                .setEmoji(EMOJI_X)
                .setStyle("SECONDARY")
            );
          // Question message
          const promptMessage: Discord.Message<true> =
            await MessageUtil.followUpOrEditReply(interaction, {
              content: enQueueState,
              components: [actionRow],
              embeds: [
                EmbedFactory.createEmbed()
                  .setTitle(locale.format(interaction.locale, "PLAYLIST"))
                  .setDescription(
                    locale.format(
                      interaction.locale,
                      "INCLUDES_PLAYLIST",
                      slicedPlaylist.length.toString()
                    )
                  )
                  .setTrackThumbnail(track.info),
              ],
            });
          // Add selected track without playlist
          await dispatcher.addTrack(
            AudioTools.getAudioTrack(track, interaction.user.id)
          );
          // Check interaction does not have channel
          if (!interaction.channel)
            throw new Error("Interaction channel not found.");
          // Create filter for awaitMessageComponents
          // button interaction user id = command user id && button interaction message id = promptMessage.id
          const buttonCollectorFilter: Discord.CollectorFilter<
            [Discord.ButtonInteraction<"cached">]
          > = (i: Discord.ButtonInteraction<"cached">): boolean =>
            i.user.id == interaction.user.id &&
            i.message.id == promptMessage.id;
          // Try collect interactions
          try {
            const collectorInteraction: Discord.ButtonInteraction<Discord.CacheType> =
              await interaction.channel.awaitMessageComponent({
                componentType: "BUTTON",
                filter: buttonCollectorFilter,
                time: BUTTON_AWAIT_TIMEOUT,
              });
            // Ok button
            if (collectorInteraction.customId === okButtonCustomId) {
              // Prevent error when user click ok button after dispatcher is destroyed
              if (!this.client.audio.hasPlayerDispatcher(interaction.guildId)) {
                await collectorInteraction.update({
                  content: enQueueState,
                  components: [],
                  embeds: [],
                });
              } else {
                // Update successfully added message
                await collectorInteraction.update({
                  content: enQueueState,
                  components: [],
                  embeds: [
                    EmbedFactory.createEmbed()
                      .setTitle(locale.format(interaction.locale, "PLAYLIST"))
                      .setDescription(
                        locale.format(
                          interaction.locale,
                          "PLAYLIST_ADDED_NOEMOJI",
                          searchResult.playlistInfo?.name ??
                            locale.format(interaction.locale, "UNKNOWN"),
                          slicedPlaylist.length.toString()
                        )
                      )
                      .setTrackThumbnail(track.info),
                  ],
                });
                // Add sliced playlist
                await dispatcher.addTracks(
                  slicedPlaylist.map((e: Track) =>
                    AudioTools.getAudioTrack(e, interaction.user.id)
                  )
                );
              }
            } else {
              // When user press cancel button, remove buttons, embeds
              await collectorInteraction.update({
                content: enQueueState,
                components: [],
                embeds: [],
              });
            }
          } catch (error) {
            const err: Error = error as Error;
            if (
              err.name.includes("INTERACTION_COLLECTOR_ERROR") &&
              err.message.includes("time")
            ) {
              // Timeout handle, remove buttons & embeds
              await interaction.editReply({
                content: enQueueState,
                components: [],
                embeds: [],
              });
            } else {
              // When something errored, throw error
              throw error;
            }
          }
        }
        break;
      // Enqueue first of search result or track
      case "SEARCH_RESULT":
      case "TRACK_LOADED":
        const guildAudioData: IGuildAudioData =
          await dispatcher.queue.getGuildAudioData();
        const addTo: IAudioTrack = {
          requesterUserId: interaction.user.id,
          track: searchResult.tracks[0],
          relatedTrack: false,
          repeated: false,
        };
        const trackEmbed: ExtendedEmbed = await EmbedFactory.getTrackEmbed(
          this.client,
          locale.getReusableFormatFunction(interaction.locale),
          addTo
        );
        await MessageUtil.followUpOrEditReply(interaction, {
          content: locale.format(
            interaction.locale,
            this.willPlayingOrEnqueued(
              guildAudioData.nowPlaying,
              guildAudioData.queue.length
            ) + "_TITLE",
            (guildAudioData.queue.length + 1).toString()
          ),
          embeds: [trackEmbed],
        });
        await dispatcher.addTrack(addTo);
        break;
    }
  }

  private willPlayingOrEnqueued(
    nowplaying: IAudioTrack | null,
    queueLength: number
  ): string {
    const localeKey: string =
      !nowplaying && queueLength === 0 ? "WILL_PLAYING" : "ENQUEUED_TRACK";
    return localeKey;
  }

  public async runAutocomplete(
    interaction: Discord.AutocompleteInteraction<Discord.CacheType>
  ): Promise<void> {
    const idealNode = this.client.audio.getNode();
    // 노드가 없다면 결과없음 반환
    if (!idealNode) return await interaction.respond([]);
    const query: string | null = interaction.options.getString("query");
    // 쿼리가 없거나 길이가 100이상이거나 URL일 경우 결과없음
    if (!query || query.length > 100 || isURL(query))
      return await interaction.respond([]);
    const searchResult = await this.fetchTracksCached(
      idealNode,
      `ytsearch:${query}`
    );
    // Search가 아니거나 검색 결과가 null 일 경우 결과 없음.
    // TODO 플레이리스트일경우 플레이리스트 추가, 한곡 추가, 등등, URL일경우 URL 정보 표시해주기
    if (!searchResult || searchResult.loadType !== "SEARCH_RESULT")
      return await interaction.respond([]);
    return interaction.respond(
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
        .slice(0, AUTOCOMPLETE_MAX_RESULT)
    );
  }

  private async fetchTracksCached(
    node: Node,
    query: string
  ): Promise<LavalinkResponse | null> {
    const cacheKey = `${node.name}-${query}`;
    const searchCache: LavalinkResponse | undefined =
      this.searchCache.get(cacheKey);
    if (searchCache) {
      this.client.log.debug(
        `Cache hit for ${cacheKey} with ${searchCache.tracks.length} tracks`
      );
      return searchCache;
    } else {
      const trackList = await node.rest.resolve(query);
      if (!trackList) return null;
      this.client.log.debug(
        `Cache miss for ${cacheKey} with ${trackList.tracks.length} tracks, caching search results & tracks`
      );
      this.searchCache.set(cacheKey, trackList);
      if (trackList.tracks.length > 0) {
        trackList.tracks.forEach((v: Track) => {
          if (v.info.uri) {
            const fakeTrackListForCache: LavalinkResponse = {
              loadType: "SEARCH_RESULT",
              playlistInfo: {},
              tracks: [v],
            };
            this.searchCache.set(
              `${node.name}-${v.info.uri}`,
              fakeTrackListForCache
            );
          }
        });
      }
      return trackList;
    }
  }
}
