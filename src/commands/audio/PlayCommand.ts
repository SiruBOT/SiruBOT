import { SlashCommandBuilder } from "@discordjs/builders";
import * as Sentry from "@sentry/node";
import * as Discord from "discord.js";
import { Track } from "shoukaku";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  IAudioTrack,
  ICommandContext,
  IGuildAudioData,
  VoiceConnectedGuildMemberVoiceState,
} from "../../types";
import locale from "../../locales";
import { isURL, Formatter, EmbedFactory } from "../../utils";
import { PlayerDispatcher } from "../../structures/audio/PlayerDispatcher";
import {
  AUTOCOMPLETE_MAX_RESULT,
  EMOJI_INBOX_TRAY,
  EMOJI_X,
} from "../../constant/MessageConstant";
import { BUTTON_AWAIT_TIMEOUT } from "../../constant/TimeConstant";
import { ExtendedEmbed } from "../../utils/ExtendedEmbed";
import { ButtonStyle, ComponentType } from "discord.js";
import { fetch } from "undici";
import { COMMAND_WARN_MESSAGE_EPHEMERAL } from "../../events/InteractionCreateEvent";
import { CommandRequirements } from "../../types/CommandTypes/CommandRequirements";

export default class PlayCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
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
          .setRequired(true)
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
          .setRequired(false)
      );
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
      CommandRequirements.AUDIO_NODE |
        CommandRequirements.VOICE_SAME_CHANNEL |
        CommandRequirements.LISTEN_STATUS,
      ["SendMessages", "Connect", "Speak", "EmbedLinks"]
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: ICommandContext<true>): Promise<void> {
    // Handle play command
    const query: string = interaction.options.getString("query", true);
    // AutoComplete 값 없는 경우 required여도 빈 값이 넘어올 수 있음
    if (query.length <= 0) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content:
          "> " +
          locale.format(interaction.locale, "PLAY_AUTOCOMPLETE_NO_QUERY"),
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
        // Handle joinChannel exception
        const exceptionId: string = Sentry.captureException(error);
        await interaction.editReply(
          locale.format(interaction.locale, "FAILED_JOIN", exceptionId)
        );
      }
    }
    await interaction.reply(
      locale.format(interaction.locale, "PLAY_SEARCHING")
    );
    // Get dispatcher
    const dispatcher: PlayerDispatcher =
      this.client.audio.getPlayerDispatcherOrfail(interaction.guildId);
    // Get ideal node, AudioNode 옵션이 true이기때문에 node 가 없을 수 없음
    const node = this.client.audio.getNode();
    if (!node) throw new Error("Ideal node not found");
    const soundCloud = interaction.options.getBoolean("soundcloud", false);
    const searchResult = await node.rest.resolve(
      isURL(query) ? query : (soundCloud ? "scsearch:" : "ytsearch:") + query
    );
    if (!searchResult) throw new Error("Search result not found");
    // Search result
    switch (searchResult.loadType) {
      case "LOAD_FAILED":
        await interaction.editReply({
          content: locale.format(interaction.locale, "LOAD_FAILED"),
        });
        break;
      case "NO_MATCHES":
        await interaction.editReply({
          content: locale.format(interaction.locale, "NO_MATCHES"),
        });
        break;
      // Playlist Handle
      case "PLAYLIST_LOADED":
        // Only playlist url
        if (searchResult.playlistInfo?.selectedTrack === -1) {
          await interaction.editReply({
            content: locale.format(
              interaction.locale,
              "PLAYLIST_ADD",
              searchResult.playlistInfo?.name ??
                locale.format(interaction.locale, "UNKNOWN"),
              searchResult.tracks.length.toString()
            ),
          });
          await dispatcher.addTracks(
            searchResult.tracks.map((e: Track) => {
              return {
                track: e,
                requesterUserId: interaction.user.id,
                relatedTrack: false,
                repeated: false,
              };
            })
          );
        } else {
          // Handles videoId with playlistId
          const guildAudioData: IGuildAudioData =
            await dispatcher.queue.getGuildAudioData();
          // Selected track
          const selectedTrack: number =
            searchResult.playlistInfo.selectedTrack ?? 0;
          const track: Track = searchResult.tracks[selectedTrack as number];
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
          const actionRow: Discord.ActionRowBuilder<Discord.ButtonBuilder> =
            new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
              new Discord.ButtonBuilder()
                .setCustomId(okButtonCustomId)
                .setEmoji(EMOJI_INBOX_TRAY)
                .setStyle(ButtonStyle.Secondary),
              new Discord.ButtonBuilder()
                .setCustomId(noButtonCustomId)
                .setEmoji(EMOJI_X)
                .setStyle(ButtonStyle.Secondary)
            );
          // Question message
          const promptMessage: Discord.Message = await interaction.editReply({
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
          await dispatcher.addTrack({
            track,
            requesterUserId: interaction.user.id,
            relatedTrack: false,
            repeated: false,
          });
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
                componentType: ComponentType.Button,
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
                  slicedPlaylist.map((e: Track) => {
                    return {
                      track: e,
                      requesterUserId: interaction.user.id,
                      relatedTrack: false,
                      repeated: false,
                    };
                  })
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
        await interaction.editReply({
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

  public override async onAutocompleteInteraction(
    interaction: Discord.AutocompleteInteraction<Discord.CacheType>
  ): Promise<void> {
    const soundCloud = interaction.options.getBoolean("soundcloud", false);
    const query: string | null = interaction.options.getString("query");
    if (!query) {
      await interaction.respond([
        {
          name: locale.format(interaction.locale, "PLAY_AUTOCOMPLETE_NO_QUERY"),
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
        }
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
          .slice(0, AUTOCOMPLETE_MAX_RESULT)
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
          .slice(0, AUTOCOMPLETE_MAX_RESULT)
      );
      return;
    }
  }
}
