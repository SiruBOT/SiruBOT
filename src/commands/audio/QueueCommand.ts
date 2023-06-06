import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageActionRowComponentBuilder,
  SlashCommandBuilder,
} from "discord.js";

import { BaseCommand, KafuuClient } from "@/structures";
import { PlayerDispatcher } from "@/structures/audio";
import {
  EMOJI_NEXT,
  EMOJI_PLAY_STATE,
  EMOJI_PREV,
  EMOJI_REFRESH,
  EMOJI_REPEAT,
  EMOJI_STOP,
} from "@/constants/message";
import {
  KafuuButtonContext,
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { GuildAudioData } from "@/types/models/audio";
import { TypeORMGuild } from "@/models/typeorm";
import { ExtendedEmbed, EmbedFactory } from "@/utils/embed";
import { chunkArray } from "@/utils/array";
import { formatTrack, humanizeSeconds, volumeEmoji } from "@/utils/formatter";
import { KafuuAudioTrack, KafuuPlayingState } from "@/types/audio";
import { STRING_KEYS } from "@/types/locales";
import { format } from "@/locales";
import { MessageComponentRenderContext, ReplyOrUpdate } from "@/types/utils";

type QueueRenderContext = Omit<
  MessageComponentRenderContext,
  "member" | "guild"
> & {
  page: number;
  guildId: string;
};

const QUEUE_PAGE_CHUNK_SIZE = 10 as const;
const QUEUE_NOWPLAYING_LINEBREAK_LENGTH = 26 as const;

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

  public override async onCommandInteraction(
    context: KafuuCommandContext
  ): Promise<void> {
    const { interaction } = context;
    const dispatcher: PlayerDispatcher =
      this.client.audio.getPlayerDispatcherOrfail(interaction.guildId);
    // 큐가 없으면 nowplaying 있는지 확인하고 nowplaying보내기
    const audioData: GuildAudioData =
      await dispatcher.queue.getGuildAudioData();
    const { queue } = audioData;
    // trackplaying 이 true이기 때문에 nowplaying 은 체크할 필요 없음
    if (queue.length === 0) {
      // Redirect to nowplaying command
      await this.client.commands
        .get("nowplaying")
        ?.onCommandInteraction(context);
      return;
    } else {
      const payload = await this.render<true>({
        page: 1,
        guildId: interaction.guildId,
        locale: interaction.locale,
      });
      await interaction.reply({ ...payload });
    }
  }

  public override async onButtonInteraction(context: KafuuButtonContext) {
    const { interaction } = context;
    if (!interaction.guildId) return;
    const page = context.customInfo.args?.[0] ?? 1;
    const payload = await this.render<false>({
      page: Number(page),
      guildId: interaction.guildId,
      locale: interaction.locale,
    });
    await interaction.update({
      ...payload,
      fetchReply: true,
      ...(context.customInfo.customId == "paginator_stop" // Stop  일 경우 components 를 없앰
        ? { components: [] }
        : undefined),
    });
  }

  private async render<IsReply extends boolean>({
    page = 1,
    guildId,
    locale,
  }: QueueRenderContext): ReplyOrUpdate<IsReply> {
    const dispatcher = this.client.audio.dispatchers.get(guildId);
    if (!dispatcher) {
      return {
        embeds: [
          EmbedFactory.createEmbed().setTitle(
            format(locale, "NOWPLAYING_NONE")
          ),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
              .setCustomId(
                this.getCustomId({
                  customId: "page_goto",
                  args: ["1"],
                })
              )
              .setEmoji(EMOJI_REFRESH)
              .setStyle(ButtonStyle.Secondary),
          ]),
        ],
      };
    }
    const { queue, nowPlaying, position }: GuildAudioData =
      await dispatcher.queue.getGuildAudioData();

    const totalPages = Math.ceil(queue.length / QUEUE_PAGE_CHUNK_SIZE);
    const guildConfig: TypeORMGuild =
      await this.client.databaseHelper.upsertAndFindGuild(guildId);
    const chunked: KafuuAudioTrack[][] = chunkArray(
      queue,
      QUEUE_PAGE_CHUNK_SIZE
    );
    let pageContent: string = chunked[page - 1]
      .map((track, index) => {
        // index = 1 ~ 10
        // page = 1 ~ end
        return `\`\`#${
          index + 1 + (page - 1) * QUEUE_PAGE_CHUNK_SIZE
        }\`\` - ${formatTrack(track, {
          showLength: true,
          withMarkdownURL: true,
        })}`;
      })
      .join("\n");
    // Embed
    const embed: ExtendedEmbed = EmbedFactory.createEmbed()
      .setTrackImage(queue[0])
      .setFooter({
        text: format(
          locale,
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
          totalPages.toString()
        ),
      });
    const buttons = this.getActionRow({ total: totalPages, current: page });
    if (nowPlaying) {
      const status: string[] = [
        `${
          EMOJI_PLAY_STATE[this.client.audio.playingState(guildId)]
        } **${format(
          locale,
          ("PLAYING_STATE_" +
            this.client.audio.playingState(guildId)) as STRING_KEYS
        )}**`,
        `${EMOJI_REPEAT[guildConfig.repeat]} **${format(
          locale,
          ("REPEAT_" + guildConfig.repeat) as STRING_KEYS
        )}**`,
        `${volumeEmoji(guildConfig.volume)} **${guildConfig.volume}%**`,
      ];

      if (
        this.client.audio.playingState(guildId) != KafuuPlayingState.NOTPLAYING
      )
        status.push(
          `**[${position ? `${humanizeSeconds(position, true)}` : "00:00"} / ${
            nowPlaying.info.length
              ? humanizeSeconds(nowPlaying.info.length, true)
              : "N/A"
          }]**`
        );

      const trackDisplay: string = formatTrack(nowPlaying, {
        streamString: format(locale, "LIVESTREAM"),
        showLength: false,
        withMarkdownURL: true,
      });
      embed.setTitle(status.join(" | "));
      pageContent =
        ` ${
          nowPlaying.info.title.length > QUEUE_NOWPLAYING_LINEBREAK_LENGTH
            ? "├"
            : "└"
        } ${trackDisplay} ${
          nowPlaying.requestUserId
            ? // 한줄 넘어가면 Username line break
              `${
                nowPlaying.info.title.length > QUEUE_NOWPLAYING_LINEBREAK_LENGTH
                  ? "\n└ "
                  : "-"
              } <@${nowPlaying.requestUserId}`
            : ""
        }>\n\n${format(locale, "QUEUE_TITLE")}\n` + pageContent;
    } else {
      pageContent = format(locale, "QUEUE_TITLE") + "\n" + pageContent;
    }

    embed.setDescription(pageContent);

    return {
      embeds: [embed],
      ...(buttons ? { components: [buttons] } : {}),
    };
  }

  private getActionRow({
    total,
    current,
  }: {
    total: number;
    current: number;
  }): ActionRowBuilder<MessageActionRowComponentBuilder> | undefined {
    const actionRow: ActionRowBuilder<MessageActionRowComponentBuilder> =
      new ActionRowBuilder<MessageActionRowComponentBuilder>();
    if (total !== 1) {
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(
            this.getCustomId({
              customId: "page_goto",
              args: [(current - 1).toString()],
            })
          )
          .setEmoji(EMOJI_PREV)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(current === 1),
        new ButtonBuilder()
          .setCustomId(
            this.getCustomId({
              customId: "paginator_stop",
            })
          )
          .setEmoji(EMOJI_STOP)
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(
            this.getCustomId({
              customId: "page_goto",
              args: [(current + 1).toString()],
            })
          )
          .setEmoji(EMOJI_NEXT)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(current == total)
      );
      return actionRow;
    }
    return undefined;
  }
}
