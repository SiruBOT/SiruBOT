import { SlashCommandBuilder } from "@discordjs/builders";
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
  VoiceBasedChannel,
} from "discord.js";
import { BaseCommand, Client } from "../../structures";
import { PlayerDispatcher } from "../../structures/audio/PlayerDispatcher";
import {
  CommandCategories,
  CommandPermissions,
  IAudioTrack,
  ICommandContext,
  IGuildAudioData,
} from "../../types";
import locale from "../../locales";
import { EmbedFactory } from "../../utils/EmbedFactory";
import { Formatter } from "../../utils";
import { COMMAND_WARN_MESSAGE_EPHEMERAL } from "../../events/InteractionCreateEvent";
import { Track } from "shoukaku";
import { AUTOCOMPLETE_MAX_RESULT } from "../../constant/MessageConstant";

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

const commandRequirements = {
  audioNode: true,
  trackPlaying: true,
  voiceStatus: {
    listenStatus: true,
    sameChannel: true,
    voiceConnected: true,
  },
} as const;
export default class SkipCommand extends BaseCommand {
  constructor(client: Client) {
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
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
      commandRequirements,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
    userPermissions,
  }: ICommandContext<typeof commandRequirements>): Promise<void> {
    const forceSkip: boolean | null = interaction.options.getBoolean(
      "forceskip",
      false
    );
    const skipTo: number | null = interaction.options.getInteger("to", false);

    const dispatcher: PlayerDispatcher =
      this.client.audio.getPlayerDispatcherOrfail(interaction.guildId);
    const { queue }: IGuildAudioData =
      await dispatcher.queue.getGuildAudioData();
    const nowplaying = await dispatcher.queue.getNowPlaying();
    const nextTrack: IAudioTrack | undefined = queue.at(0);
    // 건너뛸 곡이 없는 경우
    if (!nextTrack) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: locale.format(interaction.locale, "SKIP_NO_NEXT"),
      });
      return;
    }
    if (
      (forceSkip || skipTo != null) &&
      userPermissions.includes(CommandPermissions.DJ)
    ) {
      if (skipTo && skipTo > 0) {
        // skipTo가 있고 0보다 큰 경우
        // skipTo starts 1, but array starts 0 (skipTo >= 1)
        const skipToTrack: IAudioTrack | undefined = queue.at(skipTo - 1);
        if (!skipToTrack) {
          // 스킵할게 없으면
          await interaction.reply({
            content: locale.format(
              interaction.locale,
              "SKIP_NO_SELECTED",
              skipTo.toString()
            ),
          });
          return;
        } else {
          // skipTo 처리
          await dispatcher.skipTrack(skipTo - 1);
          await interaction.reply({
            content: locale.format(
              interaction.locale,
              "SKIP_TO_JUMP",
              interaction.member.displayName,
              skipTo.toString()
            ),
            embeds: [
              await EmbedFactory.getTrackEmbed(
                this.client,
                locale.getReusableFormatFunction(interaction.locale),
                skipToTrack
              ),
            ],
          });
          return;
        }
      } else {
        // skipTo 혹은 forceSkip일때 넘어오고, skipTo가 아니라면 실행되는 코드 = forceSkip
        await dispatcher.skipTrack();
        await interaction.reply({
          content: locale.format(
            interaction.locale,
            "SKIPPED_TRACK_FORCE",
            interaction.member.displayName
          ),
          embeds: [
            await EmbedFactory.getTrackEmbed(
              this.client,
              locale.getReusableFormatFunction(interaction.locale),
              nextTrack
            ),
          ],
        });
      }
    } else if (forceSkip || skipTo) {
      await interaction.reply({
        content: locale.format(interaction.locale, "SKIP_NO_PERMISSIONS"),
      });
      return;
    } else {
      // skip 명령어를 치면 투표한걸로 간주함
      dispatcher.queue.voteSkip.addSkipper(interaction.member.id);
      const isVoteSkipSkipped = await this.checkSkip(
        dispatcher,
        interaction.member.voice.channel
      );
      if (isVoteSkipSkipped) {
        await interaction.reply(this.buildSkippedPayload(interaction.locale));
      } else {
        await interaction.reply(
          this.buildVoteSkipPayload(
            interaction.locale,
            interaction.guildId,
            interaction.member,
            (nowplaying as IAudioTrack).track
          )
        );
      }
    }
  }

  private buildSkippedPayload(
    localeName: string
  ): InteractionReplyOptions & InteractionUpdateOptions {
    return {
      content: locale.format(localeName, "SKIPPED_TRACK_VOTED"),
      components: [],
      embeds: [],
    };
  }

  private buildVoteSkipPayload(
    localeName: string,
    guildId: string,
    member: GuildMember,
    track: Track
  ) {
    const dispatcher = this.client.audio.getPlayerDispatcherOrfail(guildId);
    const voteButton = new ButtonBuilder()
      .setCustomId(this.getCustomId("voteskip_vote"))
      .setEmoji("👍")
      .setStyle(ButtonStyle.Secondary);
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      voteButton
    );
    const trackEmbed = EmbedFactory.createEmbed()
      .setTitle(locale.format(localeName, "SKIP_VOTE_EMBED_TITLE"))
      .setDescription(
        locale.format(
          localeName,
          "SKIP_VOTE_EMBED_DESC",
          member.displayName,
          Formatter.formatTrack(
            track,
            locale.format(localeName, "LIVESTREAM"),
            {
              withMarkdownUri: true,
            }
          )
        )
      )
      .setTrackThumbnail(track.info)
      .setFooter({
        text: locale.format(
          localeName,
          "SKIP_VOTE_EMBED_FOOTER",
          dispatcher.queue.voteSkip
            .getVotedMembers(member.voice.channel as VoiceBasedChannel)
            .size.toString(),
          dispatcher.queue.voteSkip
            .getNumberOfVotesRequired(member.voice.channel as VoiceBasedChannel)
            .toString()
        ),
      });
    return {
      components: [actionRow],
      embeds: [trackEmbed],
      fetchReply: true,
    };
  }

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

  public override async onButtonInteraction(interaction: ButtonInteraction) {
    switch (interaction.customId) {
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
        content: locale.format(interaction.locale, "AVAILABLE_ONLY_PLAYING"),
      });
      return;
    }
    const queue = await dispatcher.queue.getQueue();
    const nowplaying = await dispatcher.queue.getNowPlaying();
    const nextTrack = queue.at(0);
    if (!nextTrack) {
      // 다음곡이 없다면
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: locale.format(interaction.locale, "SKIP_NO_NEXT"),
      });
      return;
    }
    if (dispatcher.queue.voteSkip.isSkipVoted(interaction.user.id)) {
      // 이미 투표하였다면
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: locale.format(interaction.locale, "SKIP_ALREADY_VOTED"),
      });
      return;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.voice.channel) {
      // 음성채널에 접속 안했다면
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: locale.format(interaction.locale, "JOIN_VOICE_FIRST"),
      });
      return;
    }
    dispatcher.queue.voteSkip.addSkipper(interaction.user.id);
    // skip 명령어를 치면 투표한걸로 간주함
    const isVoteSkipSkipped = await this.checkSkip(
      dispatcher,
      member.voice.channel
    );
    if (isVoteSkipSkipped) {
      await interaction.update(this.buildSkippedPayload(interaction.locale));
    } else {
      await interaction.update(
        this.buildVoteSkipPayload(
          interaction.locale,
          interaction.guildId,
          member,
          (nowplaying as IAudioTrack).track
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
    const start =
      (skipTo ?? queue.length + 1) > queue.length
        ? 1
        : Math.max(skipTo ?? 1, 1);
    await interaction.respond(
      queue
        .slice(start - 1, start + AUTOCOMPLETE_MAX_RESULT - 1) // Array starts 0..
        .map(
          (e, index) =>
            `#${start + index} ` + // Start + Index
            Formatter.formatTrack(
              e.track,
              locale.format(interaction.locale, "LIVESTREAM"),
              {
                showLength: false,
              }
            )
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
