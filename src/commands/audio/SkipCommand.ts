import {
  ActionRowBuilder,
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  GuildMember,
  InteractionReplyOptions,
  InteractionUpdateOptions,
  Locale,
  VoiceBasedChannel,
  SlashCommandBuilder,
} from "discord.js";
import { Track } from "shoukaku";

import {
  KafuuButtonContext,
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { BaseCommand, KafuuClient } from "@/structures";
import { PlayerDispatcher } from "@/structures/audio";
import { GuildAudioData } from "@/types/models/audio";
import { KafuuAudioTrack } from "@/types/audio";
import { HandledCommandInteraction } from "@/types/interaction";
import { COMMAND_WARN_MESSAGE_EPHEMERAL } from "@/constants/events/InteractionCreateEvent";
import { AUTOCOMPLETE_MAX_RESULT, SKIP_EMOJI } from "@/constants/message";
import { EmbedFactory } from "@/utils/embed";
import { format, getReusableFormatFunction } from "@/locales";
import { formatTrack } from "@/utils/formatter";

/**
 * SkipCommand 조건
 * - skip 명령어를 아무 인수 없이 사용할 경우
 *    -> 사용자가 혼자 음성 채널에서 듣는 경우
 *      -> 바로 건너뛰어짐
 *    -> 사용자가 여러명과 음성 채널에서 듣는 경우
 *      -> 다음 노래가 나오기 전까지 voteskip (과반수 이상이 찬성 -> skip)
 *
 * - skip 명령어에 to 가 있다면
 *    -> autocomplete
 *      ->현재 큐 자동완성 Name: #[index] 노래이름 Value: int
 *    - 관리자 체크 / DJ체크
 */

type SkipContext = {
  interaction: HandledCommandInteraction<true>;
  dispatcher: PlayerDispatcher;
  queue: KafuuAudioTrack[];
  nextTrack: KafuuAudioTrack;
};
export default class SkipCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    // Build slash command info
    const slashCommand = new SlashCommandBuilder()
      .setName("skip")
      .setNameLocalizations({
        ko: "건너뛰기",
      })
      .setDescription("Skips the current track")
      .setDescriptionLocalizations({
        ko: "현재 재생중인 노래를 건너뛸 수 있어요",
      })
      .addBooleanOption((option) => {
        return option
          .setName("forceskip")
          .setNameLocalizations({
            ko: "강제",
          })
          .setDescription("Force skip without vote skip (Only admin/dj)")
          .setDescriptionLocalizations({
            ko: "투표를 하지 않고 강제로 현재 재생중인 노래를 건너뛰어요 (관리자/DJ만 사용 가능)",
          })
          .setRequired(false);
      })
      .addIntegerOption((input) => {
        return input
          .setName("to")
          .setMinValue(1)
          .setNameLocalizations({
            ko: "점프",
          })
          .setDescription(
            "Skips to the specified track (Queue position) (Only admin/dj)"
          )
          .setDescriptionLocalizations({
            ko: "지정된 위치로 건너뛰어요 (대기열 번호) (관리자/DJ만 사용 가능)",
          })
          .setRequired(false)
          .setAutocomplete(true);
      });

    // Command Info
    super(
      slashCommand,
      client,
      KafuuCommandCategory.MUSIC,
      [KafuuCommandPermission.EVERYONE],
      KafuuCommandFlags.TRACK_PLAYING |
        KafuuCommandFlags.AUDIO_NODE |
        KafuuCommandFlags.VOICE_SAME_CHANNEL |
        KafuuCommandFlags.VOICE_CONNECTED,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
    userPermissions,
  }: KafuuCommandContext<true>): Promise<void> {
    const dispatcher: PlayerDispatcher =
      this.client.audio.getPlayerDispatcherOrfail(interaction.guildId);
    const { queue }: GuildAudioData =
      await dispatcher.queue.getGuildAudioData();
    const nowplaying = await dispatcher.queue.getNowPlaying();
    const nextTrack: KafuuAudioTrack | undefined = queue.at(0);
    // 건너뛸 곡이 없는 경우
    if (!nextTrack) {
      // TODO: 추천 영상일경우 건너뛸지 물어보기
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "SKIP_NO_NEXT"),
      });
      return;
    }
    // Forceskip 있다면 "forceskip", to 있다면 "to", 둘다 없다면 null
    const subCommand: string | null = interaction.options.getBoolean(
      "forceskip",
      false
    )
      ? "forceskip"
      : interaction.options.getInteger("to", false)
      ? "to"
      : null;
    // Force, Jump 명령어를 안쓰거나, 명령어를 썼지만 권한이 없는 경우 일반 voteSkip 으로 간주
    if (
      !subCommand ||
      (subCommand && !userPermissions.includes(KafuuCommandPermission.DJ))
    ) {
      // skip 명령어를 치면 투표한걸로 간주함
      dispatcher.queue.voteSkip.addSkipper(interaction.member.id);
      const voteSkippable = await this.checkSkip(
        dispatcher,
        interaction.member.voice.channel
      );
      if (voteSkippable) {
        await interaction.reply(this.buildSkippedPayload(interaction.locale));
      } else {
        await interaction.reply(
          this.buildVoteSkipPayload(
            interaction.locale,
            interaction.guildId,
            interaction.member,
            nowplaying as KafuuAudioTrack
          )
        );
      }
    } else if (subCommand === "forceskip") {
      // 강제스킵 핸들
      await this.forceSkip({ interaction, dispatcher, queue, nextTrack });
    } else if (subCommand === "to") {
      // skipTo 핸들
      await this.skipTo({ interaction, dispatcher, queue, nextTrack });
    }
  }

  private async forceSkip({
    interaction,
    dispatcher,
    nextTrack,
  }: SkipContext): Promise<void> {
    await dispatcher.skipTrack();
    await interaction.reply({
      content: format(
        interaction.locale,
        "SKIPPED_TRACK_FORCE",
        interaction.member.displayName
      ),
      embeds: [
        await EmbedFactory.getTrackEmbed(
          this.client,
          getReusableFormatFunction(interaction.locale),
          nextTrack
        ),
      ],
    });
  }

  private async skipTo({
    interaction,
    dispatcher,
    queue,
  }: SkipContext): Promise<void> {
    const skipTo = interaction.options.getInteger("to", true);
    const skipToTrack: KafuuAudioTrack | undefined = queue.at(skipTo - 1);
    // 점프할 곡이 없다면
    if (!skipToTrack) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "SKIP_NO_SELECTED"),
      });
      return;
    }
    // 점프할 곡이 있으면
    // skipTo 처리
    await dispatcher.skipTrack(skipTo - 1);
    await interaction.reply({
      content: format(
        interaction.locale,
        "SKIP_TO_JUMP",
        interaction.member.displayName,
        skipTo.toString()
      ),
      embeds: [
        await EmbedFactory.getTrackEmbed(
          this.client,
          getReusableFormatFunction(interaction.locale),
          skipToTrack
        ),
      ],
    });
    return;
  }

  private buildSkippedPayload(
    localeName: Locale
  ): InteractionReplyOptions & InteractionUpdateOptions {
    return {
      content: format(localeName, "SKIPPED_TRACK_VOTED"),
      components: [],
      embeds: [],
    };
  }

  // Skip 버튼 페이로드 만들기
  private buildVoteSkipPayload(
    localeName: Locale,
    guildId: string,
    member: GuildMember,
    track: Track
  ) {
    const dispatcher = this.client.audio.getPlayerDispatcherOrfail(guildId);
    const voteButton = new ButtonBuilder()
      .setCustomId(this.getCustomId({ customId: "voteskip_vote" }))
      .setEmoji(SKIP_EMOJI)
      .setLabel(
        format(
          localeName,
          "SKIP_BUTTON_LABEL",
          `${
            dispatcher.queue.voteSkip.getVotedMembers(
              member.voice.channel as VoiceBasedChannel
            ).size
          }/${dispatcher.queue.voteSkip.getNumberOfVotesRequired(
            member.voice.channel as VoiceBasedChannel
          )}` // 투표하기 (votedMembers / requiredMembers)
        )
      )
      .setStyle(ButtonStyle.Secondary);
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      voteButton
    );
    const trackEmbed = EmbedFactory.createEmbed()
      .setTitle(format(localeName, "SKIP_VOTE_EMBED_TITLE"))
      .setDescription(
        format(
          localeName,
          "SKIP_VOTE_EMBED_DESC",
          member.displayName,
          formatTrack(track, {
            streamString: format(localeName, "LIVESTREAM"),
            withMarkdownURL: true,
          })
        )
      )
      .setTrackThumbnail(track);
    return {
      components: [actionRow],
      embeds: [trackEmbed],
      fetchReply: true,
    };
  }

  // 절반이 넘어가면 스킵하는 코드
  private async checkSkip(
    dispatcher: PlayerDispatcher,
    voiceChannel: VoiceBasedChannel
  ) {
    if (dispatcher.queue.voteSkip.isAgreedHalf(voiceChannel)) {
      await dispatcher.skipTrack();
      return true;
    } else {
      false;
    }
  }

  public override async onButtonInteraction({
    interaction,
    customInfo: { customId },
  }: KafuuButtonContext) {
    switch (customId) {
      case "voteskip_vote":
        await this.handleVoteSkipButton(interaction);
        break;
    }
  }

  public async handleVoteSkipButton(interaction: ButtonInteraction) {
    if (!interaction.guildId) return;
    if (!interaction.guild) return;
    const dispatcher = this.client.audio.dispatchers.get(interaction.guildId);
    if (!dispatcher) {
      // dispatcher가 없다면 재생 중이 아님
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "AVAILABLE_ONLY_PLAYING"),
      });
      return;
    }
    const queue = await dispatcher.queue.getTracks();
    const nowplaying = await dispatcher.queue.getNowPlaying();
    const nextTrack = queue.at(0);
    if (!nextTrack) {
      // 다음곡이 없다면
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "SKIP_NO_NEXT"),
      });
      return;
    }
    if (dispatcher.queue.voteSkip.isSkipVoted(interaction.user.id)) {
      // 이미 투표하였다면
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "SKIP_ALREADY_VOTED"),
      });
      return;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.voice.channel) {
      // 음성채널에 접속 안했다면
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "JOIN_VOICE_FIRST"),
      });
      return;
    }
    dispatcher.queue.voteSkip.addSkipper(interaction.user.id);
    // skip 명령어를 치면 투표한걸로 간주함
    const voteSkippable = await this.checkSkip(
      dispatcher,
      member.voice.channel
    );
    if (voteSkippable) {
      await interaction.update(this.buildSkippedPayload(interaction.locale));
    } else {
      await interaction.update(
        this.buildVoteSkipPayload(
          interaction.locale,
          interaction.guildId,
          member,
          nowplaying as KafuuAudioTrack
        )
      );
    }
  }

  public override async onAutocompleteInteraction(
    interaction: AutocompleteInteraction
  ): Promise<void> {
    if (!interaction.guildId) {
      await interaction.respond([]);
      return;
    }
    const { queue } = await this.client.databaseHelper.upsertGuildAudioData(
      interaction.guildId
    );
    if (queue.length <= 0) {
      await interaction.respond([]);
      return;
    }
    const skipTo = interaction.options.getInteger("to", false);
    const start = Number(skipTo ? (skipTo > queue.length ? 1 : skipTo) : 1);
    await interaction.respond(
      queue
        .slice(start - 1, start + AUTOCOMPLETE_MAX_RESULT - 1) // slice array to discord's max result
        .map(
          (e, index) =>
            `#${start + index} ` + // Start + Index
            formatTrack(e, {
              streamString: format(interaction.locale, "LIVESTREAM"),
              showLength: false,
            })
        )
        .map((e, index): ApplicationCommandOptionChoiceData => {
          return {
            name: e.slice(0, 99),
            value: start + index,
          };
        })
    );
    return;
  }
}
