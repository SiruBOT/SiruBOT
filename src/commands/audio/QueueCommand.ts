import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../structures";
import { PlayerDispatcher } from "../../structures/audio/PlayerDispatcher";
import {
  CommandCategories,
  CommandPermissions,
  HandledCommandInteraction,
  IAudioTrack,
  ICommandRequirements,
  IGuildAudioData,
} from "../../types";
import { EmbedFactory, Formatter } from "../../utils";
import { ArrayUtil } from "../../utils/ArrayUtil";
import { ExtendedEmbed } from "../../utils/ExtendedEmbed";
import { PageFn, Paginator } from "../../utils/Paginator";
import locale from "../../locales";

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
      ["SEND_MESSAGES"]
    );
  }

  public async runCommand(
    interaction: HandledCommandInteraction<typeof commandRequirements>
  ): Promise<void> {
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
      const pageFn: PageFn = async (page: number, maxPage: number) => {
        const queue: IAudioTrack[] = await dispatcher.queue.getQueue();
        const chunked: IAudioTrack[][] = ArrayUtil.chunkArray(
          queue,
          SPLIT_SIZE
        );
        const embed: ExtendedEmbed = EmbedFactory.createEmbed();
        const pageContent: string = chunked[page - 1]
          .map((track, index) => {
            // index = 1 ~ 10
            // page = 1 ~ end
            return `**#${index + 1 + (page - 1) * 10}** \`\`[${
              track.shoukakuTrack.info.length
                ? Formatter.humanizeSeconds(
                    track.shoukakuTrack.info.length / 1000
                  )
                : "N/A"
            }]\`\`  ${track.shoukakuTrack.info.title ?? "N/A"} <@${
              track.requesterUserId
            }>`;
          })
          .join("\n");
        embed.setTrackThumbnail(queue[0].shoukakuTrack.info);
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
                    track.shoukakuTrack.info.length &&
                    !track.shoukakuTrack.info.isStream
                  );
                })
                .reduce((prev, bTrack) => {
                  return prev + (bTrack.shoukakuTrack.info.length ?? 0);
                }, 0) / 1000
            ),
            page.toString(),
            maxPage.toString()
          ),
        });
        return { embeds: [embed] };
      };
      const queuePaginator = new Paginator({
        totalPages: Math.ceil(queue.length / SPLIT_SIZE),
        baseCustomId: "queue_command",
        pageFn,
      });
      await interaction.deferReply();
      await queuePaginator.start(interaction);
    } else {
      await interaction.deferReply();
      await interaction.editReply({
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
