import { SlashCommandBuilder } from "@discordjs/builders";
import {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  Collection,
  GuildMember,
} from "discord.js";
import { BaseCommand, Client } from "../../structures";
import { PlayerDispatcher } from "../../structures/audio/PlayerDispatcher";
import {
  CommandCategories,
  CommandPermissions,
  IAudioTrack,
  ICommandContext,
  ICommandRequirements,
  IGuildAudioData,
} from "../../types";
import locale from "../../locales";
import { EmbedFactory } from "../../utils/EmbedFactory";
import { Formatter } from "../../utils";
import picker from "../../locales";
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
      {
        audioNode: true,
        trackPlaying: true,
        voiceStatus: {
          listenStatus: true,
          sameChannel: true,
          voiceConnected: true,
        },
      },
      ["SendMessages"]
    );
  }

  public async onCommandInteraction({
    interaction,
    userPermissions,
  }: ICommandContext<ICommandRequirements>): Promise<void> {
    const forceSkip: boolean | null =
      interaction.options.getBoolean("forceskip");
    const skipTo: number | null = interaction.options.getInteger("to");
    const voiceMembers: Collection<string, GuildMember> | undefined =
      interaction.member.voice.channel?.members;
    if (voiceMembers) {
      // Filter voice members without bot and deafened users
      const actualListenMembers: Collection<string, GuildMember> =
        voiceMembers.filter(
          (member) => member.id !== this.client.user?.id && !member.voice.deaf
        );
      const dispatcher: PlayerDispatcher =
        this.client.audio.getPlayerDispatcher(interaction.guildId);
      const { queue }: IGuildAudioData =
        await dispatcher.queue.getGuildAudioData();
      const nextTrack: IAudioTrack | undefined = queue.at(0);
      if (nextTrack) {
        // Listen alone
        if (actualListenMembers.size === 1) {
          await dispatcher.skipTrack();
          await interaction.reply({
            content: locale.format(interaction.locale, "SKIPPED_TRACK"),
            embeds: [
              await EmbedFactory.getTrackEmbed(
                this.client,
                locale.getReusableFormatFunction(interaction.locale),
                nextTrack
              ),
            ],
          });
          return;
        } else if (forceSkip) {
          // Admin 도 DJ이기 때문에 DJ만 있는지 확인하면 됨
          if (userPermissions.includes(CommandPermissions.DJ)) {
            // TODO: Handle ForceSkip
          } else {
            await interaction.reply({
              content: locale.format(interaction.locale, "SKIP_NO_PERMISSIONS"),
            });
            return;
          }
        } else {
          // VoteSkip
          // TODO: Implement voteskip
        }
      } else {
        await dispatcher.cleanStop();
        await interaction.reply({
          content: locale.format(interaction.locale, "SKIP_NO_NEXT_STOPPED"),
        });
      }
    }
  }

  public async onAutocompleteInteraction(
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
    await interaction.respond(
      queue
        .map(
          (e, index) =>
            `#${index}` +
            Formatter.formatTrack(
              e.track,
              picker.format("ko", "LIVESTREAM"),
              true
            )
        )
        .slice(0, 25) // Discord autocomplete result it limited by 25
        .map((e, index): ApplicationCommandOptionChoiceData => {
          return {
            name: e,
            value: index,
          };
        })
    );
    return;
  }
}
