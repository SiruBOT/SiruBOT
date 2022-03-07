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
import { AudioUtils } from "../../structures/audio/AudioUtils";
import {
  EMOJI_INBOX_TRAY,
  EMOJI_PLAYLIST,
  EMOJI_X,
} from "../../constant/Constants";

export default class PlayCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("play")
      .setDescription("노래나 재생 목록을 재생해요")
      .addStringOption((option) => {
        return option
          .setName("query")
          .setDescription("노래 검색어")
          .setRequired(true);
      });
    super(
      slashCommand,
      client,
      CommandCategories.GENERAL,
      [CommandPermissions.EVERYONE],
      {
        audioNode: true,
        trackPlaying: false,
        guildPermissions: ["SEND_MESSAGES", "CONNECT", "SPEAK", "EMBED_LINKS"],
        voiceStatus: {
          listenStatus: true,
          sameChannel: false, // false or true
          voiceConnected: true,
        },
      }
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
              AudioUtils.getAudioTrack(e, interaction.user.id)
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
          const enQueueState: string = this.willPlayingOrEnqueued(
            guildAudioData.nowPlaying,
            guildAudioData.queue.length,
            interaction.locale,
            track
          );
          const okButtonCustomId = "play_command_playlist_ok";
          const noButtonCustomId = "noButton";
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
            AudioUtils.getAudioTrack(track, interaction.user.id)
          );
          // Check interaction does not have channel
          if (!interaction.channel)
            throw new Error("Interaction channel not found.");
          // Create filter for awaitMessageComponent
          const buttonCollectorFilter: Discord.CollectorFilter<
            [Discord.ButtonInteraction<"cached">]
          > = (i: Discord.ButtonInteraction<"cached">) =>
            i.user.id === interaction.user.id;
          try {
            const collectorInteraction: Discord.ButtonInteraction<Discord.CacheType> =
              await interaction.channel.awaitMessageComponent({
                componentType: "BUTTON",
                filter: buttonCollectorFilter,
                time: 20000,
              });
            if (collectorInteraction.customId === okButtonCustomId) {
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
                  AudioUtils.getAudioTrack(e, interaction.user.id)
                )
              );
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
        await followUpOrEditReply(
          this.willPlayingOrEnqueued(
            guildAudioData.nowPlaying,
            guildAudioData.queue.length,
            interaction.locale,
            searchResult.tracks[0]
          )
        );
        await dispatcher.addTrack({
          requesterUserId: interaction.user.id,
          shoukakuTrack: searchResult.tracks[0],
          relatedTrack: false,
          repeated: false,
        });
        break;
    }
  }

  willPlayingOrEnqueued(
    nowplaying: IAudioTrack | null,
    queueLength: number,
    localeName: string,
    track: ShoukakuTrack
  ): string {
    const localeKey: string =
      !nowplaying && queueLength === 0 ? "WILL_PLAYING" : "ENQUEUED_TRACK";
    return localeKey === "WILL_PLAYING"
      ? locale.format(
          localeName,
          "WILL_PLAYING",
          Formatter.formatTrack(track, locale.format(localeName, "LIVESTREAM"))
        )
      : locale.format(
          localeName,
          "ENQUEUED_TRACK",
          Formatter.formatTrack(track, locale.format(localeName, "LIVESTREAM")),
          (queueLength + 1).toString()
        );
  }
}
