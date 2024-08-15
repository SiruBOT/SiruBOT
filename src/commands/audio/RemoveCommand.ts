import { AUTOCOMPLETE_MAX_RESULT } from "@/constants/message";
import { format } from "@/locales";
import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { formatTrack } from "@/utils/formatter";
import {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  SlashCommandBuilder,
} from "discord.js";

export default class RemoveCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("remove")
      .setDescription("Remove a song from the queue.")
      .setNameLocalizations({
        ko: "삭제",
      })
      .setDescriptionLocalizations({
        ko: "대기열에서 노래를 삭제해요.",
      })
      .addIntegerOption((option) =>
        option
          .setName("position")
          .setNameLocalizations({
            ko: "위치",
          })
          .setDescription("The index of the song to remove.")
          .setDescriptionLocalizations({
            ko: "삭제할 노래의 위치를 입력해주세요.",
          })
          .setMinValue(1)
          .setAutocomplete(true)
          .setRequired(true),
      );
    super({
      slashCommand,
      client,
      category: KafuuCommandCategory.MUSIC,
      // Remove command for everyone, but only dj remove other's track
      permissions: [KafuuCommandPermission.EVERYONE],
      requirements:
        KafuuCommandFlags.TRACK_PLAYING | KafuuCommandFlags.AUDIO_NODE,
      botPermissions: ["SendMessages"],
    });
  }
  public override async onCommandInteraction({
    interaction,
    userPermissions,
  }: KafuuCommandContext<false>): Promise<void> {
    const dispatcher = this.client.audio.getPlayerDispatcherOrfail(
      interaction.guildId,
    );

    const position = interaction.options.getInteger("position", true);
    const { queue } = await dispatcher.queue.getGuildAudioData();
    if (position < 1 || position > queue.length) {
      await interaction.reply({
        content: format(
          interaction.locale,
          "REMOVE_INVALID",
          position.toString(),
        ),
      });
      return;
    }

    // User is not a DJ and not the same user who requested the track
    if (
      !userPermissions.includes(KafuuCommandPermission.DJ) &&
      queue[position - 1].requestUserId !== interaction.user.id
    ) {
      await interaction.reply({
        content: format(interaction.locale, "REMOVE_NOT_ALLOWED"),
      });
      return;
    }

    const removedTrack = await dispatcher.queue.removeTrack(position - 1);
    await interaction.reply({
      content: format(
        interaction.locale,
        "REMOVED_TRACK",
        position.toString(),
        formatTrack(removedTrack, {
          showLength: true,
          withMarkdownURL: false,
        }),
      ),
    });
  }

  public override async onAutocompleteInteraction(
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    // 길드에서만 사용 가능
    if (!interaction.inGuild()) return;
    // dispatcher 를 가져옴
    const dispatcher = await this.client.audio.getPlayerDispatcher(
      interaction.guildId,
    );
    // position 을 가져옴
    const position = interaction.options.getInteger("position", false);
    // position, dispatcher 가 없으면 return
    if (!dispatcher) return;
    // queue 를 가져옴
    const { queue } = await dispatcher.queue.getGuildAudioData();
    // 대기열에 아무것도 없으면 return
    if (queue.length <= 0) {
      await interaction.respond([]);
      return;
    }
    // position 이 있고 queue.length 보다 크면 1, 아니면 position, position 이 없으면 1
    const start = position ? (position > queue.length ? 1 : position) : 1;
    await interaction.respond(
      queue
        // start - 1 부터 start + MAX_RESULT 까지
        .slice(start - 1, start + AUTOCOMPLETE_MAX_RESULT - 1) // slice array to discord's max result
        .map(
          (e, index) =>
            `#${start + index} ` + // 시작 값 + 인덱스 (ex: start가 3이면, index는 0부터 시작하니까 3 + 0 = 3, 3 + 1 = 4, 3 + 2 = 5)
            formatTrack(e, {
              streamString: format(interaction.locale, "LIVESTREAM"),
              showLength: true,
            }),
        )
        .map((e, index): ApplicationCommandOptionChoiceData => {
          return {
            name: e.slice(0, 99), // 100자 초과 방지
            value: start + index,
          };
        }),
    );
    return;
  }
}
