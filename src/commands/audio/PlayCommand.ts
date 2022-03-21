import { SlashCommandBuilder } from "@discordjs/builders";
import * as Sentry from "@sentry/node";
import * as Discord from "discord.js";
import { ShoukakuSocket, ShoukakuTrack, ShoukakuTrackList } from "shoukaku";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  HandledCommandInteraction,
  IAudioTrack,
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
} from "../../constant/Constants";
import { ExtendedEmbed } from "../../utils/ExtendedEmbed";

export default class PlayCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("play")
      .setDescription("노래나 재생 목록을 재생해요")
      .addStringOption((option) => {
        return option
          .setName("query")
          .setDescription("노래 검색어")
          .setAutocomplete(true)
          .setRequired(true);
      });
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
      {
        audioNode: true,
        trackPlaying: false,
        voiceStatus: {
          listenStatus: true,
          sameChannel: false, // false or true
          voiceConnected: true,
        },
      },
      ["SEND_MESSAGES", "CONNECT", "SPEAK", "EMBED_LINKS"]
    );
  }

  public async runCommand(
    interaction: HandledCommandInteraction<"voiceConnected">,
    soundCloud = false
  ): Promise<void> {
    await interaction.deferReply();
    // Join voice channel before playing
    if (!this.client.audio.dispatchers.get(interaction.guildId)) {
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
        throw error;
      }
      await interaction.editReply({
        content: locale.format(
          interaction.locale,
          "JOINED_VOICE",
          voice.channelId
        ),
      });
    }
    const query: string = interaction.options.getString("query", true);
    // Get ideal node
    const node: ShoukakuSocket = this.client.audio.getNode();
    const dispatcher: PlayerDispatcher | undefined =
      this.client.audio.dispatchers.get(interaction.guildId);
    if (!dispatcher) throw new Error("PlayerDispatcher not found.");
    const searchResult: ShoukakuTrackList = await node.rest.resolve(
      isURL(query) ? query : (soundCloud ? "scsearch:" : "ytsearch:") + query
    );
    const followUpOrEditReply: (
      options: string | Discord.MessagePayload | Discord.InteractionReplyOptions
    ) => Promise<Discord.Message<true>> = async (
      options: string | Discord.MessagePayload | Discord.InteractionReplyOptions
    ) => {
      if (interaction.replied) {
        return interaction.followUp(options);
      } else {
        return interaction.editReply(options);
      }
    };
    // Search result
    switch (searchResult.type) {
      case ShoukakuTrackListType.LoadFailed:
        await followUpOrEditReply({
          content: locale.format(interaction.locale, "LOAD_FAILED"),
        });
        break;
      case ShoukakuTrackListType.NoMatches:
        await followUpOrEditReply({
          content: locale.format(interaction.locale, "NO_MATCHES"),
        });
        break;
      case ShoukakuTrackListType.PlayList:
        // Only playlist url
        if (
          searchResult.selectedTrack === -1 ||
          !searchResult.tracks[searchResult.selectedTrack ?? -1]
        ) {
          await followUpOrEditReply({
            content: locale.format(
              interaction.locale,
              "PLAYLIST_ADD",
              searchResult.playlistName ??
                locale.format(interaction.locale, "UNKNOWN"),
              searchResult.tracks.length.toString()
            ),
          });
          await dispatcher.addTracks(
            searchResult.tracks.map((e: ShoukakuTrack) =>
              AudioTools.getAudioTrack(e, interaction.user.id)
            )
          );
        } else {
          // Handles videoId with playlistId
          const guildAudioData: IGuildAudioData =
            await dispatcher.queue.getGuildAudioData();
          // Selected track
          const selectedTrack: number = searchResult.selectedTrack ?? 0;
          const track: ShoukakuTrack = searchResult.tracks[selectedTrack];
          const slicedPlaylist: ShoukakuTrack[] = searchResult.tracks.slice(
            selectedTrack + 1, // Array starts 0
            searchResult.tracks.length
          );
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
          const okButtonCustomId = "play_command_playlist_ok";
          const noButtonCustomId = "play_command_playlist_cancel";
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
          const promptMessage: Discord.Message<true> =
            await followUpOrEditReply({
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
          // Add track (not playlist)
          await dispatcher.addTrack(
            AudioTools.getAudioTrack(track, interaction.user.id)
          );
          // Check interaction does not have channel
          if (!interaction.channel)
            throw new Error("Interaction channel not found.");
          // Create filter for awaitMessageComponent
          const buttonCollectorFilter: Discord.CollectorFilter<
            [Discord.ButtonInteraction<"cached">]
          > = (i: Discord.ButtonInteraction<"cached">) =>
            i.user.id == interaction.user.id &&
            i.message.id == promptMessage.id;
          try {
            const collectorInteraction: Discord.ButtonInteraction<Discord.CacheType> =
              await interaction.channel.awaitMessageComponent({
                componentType: "BUTTON",
                filter: buttonCollectorFilter,
                time: 20000,
              });
            if (collectorInteraction.customId === okButtonCustomId) {
              const dispatcher: PlayerDispatcher | undefined =
                this.client.audio.dispatchers.get(interaction.guildId);
              if (!dispatcher) {
                await collectorInteraction.update({
                  content: enQueueState,
                  components: [],
                  embeds: [],
                });
              } else {
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
                          searchResult.playlistName ??
                            locale.format(interaction.locale, "UNKNOWN"),
                          slicedPlaylist.length.toString()
                        )
                      )
                      .setTrackThumbnail(track.info),
                  ],
                });
                await dispatcher.addTracks(
                  slicedPlaylist.map((e: ShoukakuTrack) =>
                    AudioTools.getAudioTrack(e, interaction.user.id)
                  )
                );
              }
            } else {
              // User cancel
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
              await interaction.editReply({
                content: enQueueState,
                components: [],
                embeds: [],
              });
            } else {
              throw error;
            }
          }
        }
        break;
      case ShoukakuTrackListType.Search:
      case ShoukakuTrackListType.Track:
        const guildAudioData: IGuildAudioData =
          await dispatcher.queue.getGuildAudioData();
        const addTo: IAudioTrack = {
          requesterUserId: interaction.user.id,
          shoukakuTrack: searchResult.tracks[0],
          relatedTrack: false,
          repeated: false,
        };
        const trackEmbed: ExtendedEmbed = await EmbedFactory.getTrackEmbed(
          this.client,
          locale.getReusableFormatFunction(interaction.locale),
          addTo
        );
        await followUpOrEditReply({
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

  willPlayingOrEnqueued(
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
    const idealNode: ShoukakuSocket = this.client.audio.getNode();
    // 노드가 없다면 결과없음 반환
    if (!idealNode) return await interaction.respond([]);
    const query: string | null = interaction.options.getString("query");
    // 쿼리가 없거나 길이가 100이상이거나 URL일 경우 결과없음
    if (!query || query.length > 100 || isURL(query))
      return await interaction.respond([]);
    const searchResult: ShoukakuTrackList = await idealNode.rest.resolve(
      `ytsearch:${query}`
    );
    // Search가 아니면 결과없음
    if (searchResult.type !== "SEARCH") return await interaction.respond([]);
    return interaction.respond(
      searchResult.tracks
        .map((v: ShoukakuTrack) => {
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
}
