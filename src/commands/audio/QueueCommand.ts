import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../structures";
import { PlayerDispatcher } from "../../structures/audio/PlayerDispatcher";
import {
  CommandCategories,
  CommandPermissions,
  IAudioTrack,
  ICommandContext,
  IGuildAudioData,
} from "../../types";
import { Guild } from "../../database/mysql/entities/Guild";
import { EmbedFactory, Formatter } from "../../utils";
import { ArrayUtil } from "../../utils/ArrayUtil";
import { ExtendedEmbed } from "../../utils/ExtendedEmbed";
import { Paginator } from "../../utils/Paginator";
import locale from "../../locales";
import { EMOJI_PLAY_STATE, EMOJI_REPEAT } from "../../constant/MessageConstant";

const SPLIT_SIZE = 10;
const commandRequirements = {
  audioNode: true,
  trackPlaying: true,
  voiceStatus: {
    listenStatus: false,
    sameChannel: false,
    voiceConnected: false,
  },
} as const;

export default class QueueCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("queue")
      .setDescription("대기열의 노래들을 보여드려요");
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
      commandRequirements,
      ["SendMessages"]
    );
  }

  public async onCommandInteraction({
    interaction,
  }: ICommandContext<typeof commandRequirements>): Promise<void> {
    const dispatcher: PlayerDispatcher = this.client.audio.getPlayerDispatcher(
      interaction.guildId
    );
    // Page Clousure Function
    // 큐가 없으면 nowplaying 있는지 확인하고 nowplaying보내기
    const audioData: IGuildAudioData =
      await dispatcher.queue.getGuildAudioData();
    const { queue, nowPlaying, position } = audioData;
    // trackplaying 이 true이기 때문에 nowplaying 은 체크할 필요 없음
    if (queue.length > 0) {
      const queuePaginator = new Paginator({
        totalPages: Math.ceil(queue.length / SPLIT_SIZE),
        baseCustomId: "queue_command",
        pageFn: async (page: number, maxPage: number) => {
          const audioData: IGuildAudioData =
            await dispatcher.queue.getGuildAudioData();
          const guildConfig: Guild =
            await this.client.databaseHelper.upsertAndFindGuild(
              interaction.guildId
            );
          const chunked: IAudioTrack[][] = ArrayUtil.chunkArray(
            audioData.queue,
            SPLIT_SIZE
          );
          // Embed
          const embed: ExtendedEmbed = EmbedFactory.createEmbed();
          const pageContent: string = chunked[page - 1]
            .map((track, index) => {
              // index = 1 ~ 10
              // page = 1 ~ end
              return `\`\`#${index + 1 + (page - 1) * 10} [${
                track.track.info.length
                  ? Formatter.humanizeSeconds(track.track.info.length / 1000)
                  : "N/A"
              }]\`\` | **${track.track.info.title ?? "N/A"}** <@${
                track.requesterUserId
              }>`;
            })
            .join("\n");
          embed.setTrackThumbnail(queue[0].track.info);
          embed.setDescription(pageContent);
          embed.setFooter({
            text: locale.format(
              interaction.locale,
              "QUEUE_EMBED_FOOTER",
              queue.length.toString(),
              Formatter.humanizeSeconds(
                queue
                  .filter((track) => {
                    return (
                      track.track.info.length && !track.track.info.isStream
                    );
                  })
                  .reduce((prev, bTrack) => {
                    return prev + (bTrack.track.info.length ?? 0);
                  }, 0) / 1000
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
                  this.client.audio.getPlayingState(interaction.guildId)
                ]
              } **${locale.format(
                interaction.locale,
                "PLAYING_STATE_" +
                  this.client.audio.getPlayingState(interaction.guildId)
              )}**`
            );
            status.push(
              `${EMOJI_REPEAT[guildConfig.repeat]} **${locale.format(
                interaction.locale,
                "REPEAT_" + guildConfig.repeat
              )}**`
            );
            status.push(
              `${Formatter.volumeEmoji(guildConfig.volume)} **${
                guildConfig.volume
              }%**`
            );
            status.push(
              `**[${
                audioData.position
                  ? `${Formatter.humanizeSeconds(audioData.position / 1000)}`
                  : "N/A"
              } / ${
                audioData.nowPlaying.track.info.length
                  ? Formatter.humanizeSeconds(
                      audioData.nowPlaying.track.info.length / 1000
                    )
                  : "N/A"
              }]**`
            );
            const npInfo: string =
              "> " +
              `**${Formatter.formatTrack(
                audioData.nowPlaying.track,
                locale.format(interaction.locale, "LIVESTREAM"),
                false
              )}**\n` +
              status.join(" | ");
            return {
              embeds: [embed],
              content: npInfo,
            };
          } else {
            return {
              embeds: [],
              content: locale.format(interaction.locale, "NOWPLAYING_NONE"),
            };
          }
        },
      });
      await interaction.deferReply();
      await queuePaginator.start(interaction);
    } else {
      await interaction.deferReply();
      await interaction.editReply({
        content: locale.format(
          interaction.locale,
          "NOWPLAYING_TITLE",
          dispatcher.player.connection.channelId ?? "N/A"
        ),
        embeds: [
          await EmbedFactory.getNowplayingEmbed(
            this.client,
            locale.getReusableFormatFunction(interaction.locale),
            nowPlaying,
            position
          ),
        ],
      });
    }
  }
}
