import { SlashCommandBuilder } from "discord.js";

import { BaseCommand, KafuuClient } from "@/structures";
import { PlayerDispatcher } from "@/structures/audio";
import { EMOJI_PLAY_STATE, EMOJI_REPEAT } from "@/constants/message";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { GuildAudioData } from "@/types/models/audio";
import { TypeORMGuild } from "@/models/typeorm";
import { ExtendedEmbed, EmbedFactory } from "@/utils/embed";
import { Paginator } from "@/utils/paginator";
import { chunkArray } from "@/utils/array";
import { formatTrack, humanizeSeconds, volumeEmoji } from "@/utils/formatter";
import { KafuuAudioTrack } from "@/types/audio";
import { STRING_KEYS } from "@/types/locales";
import { format } from "@/locales";

const SPLIT_SIZE = 10;

export default class QueueCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("queue")
      .setNameLocalizations({
        ko: "큐",
      })
      .setDescription("Shows queued tracks of this guild")
      .setDescriptionLocalizations({
        ko: "이 서버의 노래 대기열을 보여드려요",
      });
    super(
      slashCommand,
      client,
      KafuuCommandCategory.MUSIC,
      [KafuuCommandPermission.EVERYONE],
      KafuuCommandFlags.TRACK_PLAYING | KafuuCommandFlags.AUDIO_NODE,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    const dispatcher: PlayerDispatcher =
      this.client.audio.getPlayerDispatcherOrfail(interaction.guildId);
    // 큐가 없으면 nowplaying 있는지 확인하고 nowplaying보내기
    const audioData: GuildAudioData =
      await dispatcher.queue.getGuildAudioData();
    const { queue } = audioData;
    // trackplaying 이 true이기 때문에 nowplaying 은 체크할 필요 없음
    if (queue.length > 0) {
      const queuePaginator = new Paginator({
        totalPages: Math.ceil(queue.length / SPLIT_SIZE),
        baseCustomId: "queue_command",
        // Page Clousure Function
        pageFn: async (page: number, maxPage: number) => {
          const audioData: GuildAudioData =
            await dispatcher.queue.getGuildAudioData();
          const guildConfig: TypeORMGuild =
            await this.client.databaseHelper.upsertAndFindGuild(
              interaction.guildId
            );
          const chunked: KafuuAudioTrack[][] = chunkArray(
            audioData.queue,
            SPLIT_SIZE
          );
          const pageContent: string = chunked[page - 1]
            .map((track, index) => {
              // index = 1 ~ 10
              // page = 1 ~ end
              return `\`\`#${index + 1 + (page - 1) * 10} [${
                track.info.length
                  ? humanizeSeconds(track.info.length, true)
                  : "N/A"
              }]\`\` | **${track.info.title ?? "N/A"}** <@${
                track.requestUserId
              }>`;
            })
            .join("\n");
          // Embed
          const embed: ExtendedEmbed = EmbedFactory.createEmbed()
            .setTrackThumbnail(queue[0].info)
            .setDescription(pageContent)
            .setFooter({
              text: format(
                interaction.locale,
                "QUEUE_EMBED_FOOTER",
                queue.length.toString(),
                humanizeSeconds(
                  queue
                    .filter((track) => {
                      return track.info.length && !track.info.isStream;
                    })
                    .reduce((prev, bTrack) => {
                      return prev + (bTrack.info.length ?? 0);
                    }, 0),
                  true
                ),
                page.toString(),
                maxPage.toString()
              ),
            });
          if (audioData.nowPlaying) {
            const status: string[] = [];
            status.push(
              `${
                EMOJI_PLAY_STATE[
                  this.client.audio.playingState(interaction.guildId)
                ]
              } **${format(
                interaction.locale,
                ("PLAYING_STATE_" +
                  this.client.audio.playingState(
                    interaction.guildId
                  )) as STRING_KEYS
              )}**`
            );
            status.push(
              `${EMOJI_REPEAT[guildConfig.repeat]} **${format(
                interaction.locale,
                ("REPEAT_" + guildConfig.repeat) as STRING_KEYS
              )}**`
            );
            status.push(
              `${volumeEmoji(guildConfig.volume)} **${guildConfig.volume}%**`
            );
            status.push(
              `**[${
                audioData.position
                  ? `${humanizeSeconds(audioData.position, true)}`
                  : "N/A"
              } / ${
                audioData.nowPlaying.info.length
                  ? humanizeSeconds(audioData.nowPlaying.info.length, true)
                  : "N/A"
              }]**`
            );
            const npInfo: string =
              "> " +
              `**${formatTrack(
                audioData.nowPlaying,
                format(interaction.locale, "LIVESTREAM"),
                {
                  showLength: false,
                }
              )}**\n` +
              status.join(" | ");
            return {
              embeds: [embed],
              content: npInfo,
            };
          } else {
            return {
              embeds: [],
              content: format(interaction.locale, "NOWPLAYING_NONE"),
            };
          }
        },
        // End of Page Function
      });
      await interaction.deferReply();
      await queuePaginator.start(interaction);
    } else {
      await interaction.deferReply();
      await interaction.editReply({
        content: format(
          interaction.locale,
          "NOWPLAYING_TITLE",
          dispatcher.player.connection.channelId ?? "N/A"
        ),
        embeds: [
          await this.client.audio.getNowPlayingEmbed(
            interaction.guildId,
            interaction.locale
          ),
        ],
      });
    }
  }
}
