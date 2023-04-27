import { SlashCommandBuilder } from "@discordjs/builders";

import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { format } from "@/locales";
import { humanizeSeconds } from "@/utils/formatter";
import { decode, TrackInfo } from "@lavalink/encoding";
import { COMMAND_WARN_MESSAGE_EPHEMERAL } from "@/constants/events/InteractionCreateEvent";

export default class SeekCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("seek")
      .setNameLocalizations({
        ko: "탐색",
      })
      .setDescription("Seek player to position")
      .setDescriptionLocalizations({
        ko: "특정 위치로 플레이어를 이동시켜요",
      })
      .addStringOption((option) =>
        option
          .setName("position")
          .setNameLocalizations({
            ko: "위치",
          })
          .setDescription("Position to seek (+1:10, -1:10, 3:20, 1:12:3)")
          .setDescriptionLocalizations({
            ko: "이동할 위치 (+1:10, -1:10, 3:20, 1:12:3)",
          })
          .setRequired(true)
      );
    super(
      slashCommand,
      client,
      KafuuCommandCategory.MUSIC,
      [KafuuCommandPermission.DJ],
      KafuuCommandFlags.AUDIO_NODE |
        KafuuCommandFlags.TRACK_PLAYING |
        KafuuCommandFlags.LISTEN_STATUS |
        KafuuCommandFlags.VOICE_SAME_CHANNEL |
        KafuuCommandFlags.VOICE_CONNECTED,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext<true>): Promise<void> {
    const dispatcher = this.client.audio.getPlayerDispatcherOrfail(
      interaction.guildId
    );
    const decodedTrack: TrackInfo = decode(dispatcher.player.track as string);
    if (decodedTrack.isStream) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "SEEK_LIVESTREAM"),
      });
      return;
    }
    // 옵션 값 받기
    let seekInput = interaction.options.getString("position", true);
    // 현재 위치에서 더하거나 빼기, 혹은 특정 위치로 이동할지
    let seekOperation: "+" | "-" | null = null;
    // + 나 -로 옵션 값이 시작한다면
    // seekOperation 에 시작 값을 넣음 (+ 혹은 -)
    // seekInput 값을 + - 를 제거한 값으로 설정
    if (seekInput.startsWith("+") || seekInput.startsWith("-")) {
      seekOperation = seekInput.charAt(0) as "+" | "-";
      seekInput = seekInput.substring(1);
    }
    // HH:MM:SS 타입을 ms 로 변환
    let seekTo: number | typeof NaN = this.parseTime(seekInput);
    // 파싱에 실패한 경우
    if (Number.isNaN(seekTo)) {
      await interaction.reply("NaN seek Position");
      return;
    }
    // 특정 위치로 이동 = seekOperation = null -> seekTo 그대로 적용
    // 더하기 = seekOperation = "+" -> dispatcher 포지션 + seekTo 로 설정
    // 빼기 = seekOperation = "-" -> dispatcher 포지션 - seekTo 로 설정
    seekTo = !seekOperation
      ? seekTo
      : seekOperation == "+"
      ? dispatcher.player.position + seekTo
      : dispatcher.player.position - seekTo;

    if (seekTo >= decodedTrack.length) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(
          interaction.locale,
          "SEEK_MAX_LENGTH",
          humanizeSeconds(seekTo, true)
        ),
      });
      return;
    }
    if (seekTo <= 0) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "SEEK_MIN_LENGTH"),
      });
      return;
    }
    await dispatcher.seekTo(seekTo);
    await interaction.reply({
      content: format(
        interaction.locale,
        "SEEK_SUCCESS",
        seekOperation == "-" ? "⏪" : "⏩",
        humanizeSeconds(seekTo, true)
      ),
      embeds: [
        await this.client.audio.getNowPlayingEmbed(
          interaction.guildId,
          interaction.locale
        ),
      ],
    });
    return;
  }

  private parseTime(input: string): number | typeof NaN {
    let sec = 0;
    const splitter = ":";
    const splitNumbers: number[] = input.split(splitter).map(Number);
    try {
      // 배열 요소에 NaN 이나 유한한 값이 아닌 값이 들어있으면 NaN 반환
      splitNumbers.map((num: number) => {
        if (isNaN(num) || !isFinite(num)) throw new Error();
      });
    } catch {
      return NaN;
    }
    if (splitNumbers.length < 0) return NaN;
    /**
     * 1. 'HH:MM:SS' => ['HH', 'MM', 'SS']
     * 2. 'MM:SS' => ['MM', 'SS']
     * 3. 'SS' => ['SS']
     */
    splitNumbers.reverse(); // 초부터 처리하기 위해 배열을 뒤집어줌
    /**
     * 1. ['SS', 'MM', 'HH']
     * 2. ['MM', 'SS']
     * 3. ['SS']
     */
    // Math.floor -> Ignore 12.3:45:6
    if (splitNumbers.length === 1 && splitNumbers[0])
      sec += Math.floor(splitNumbers[0]); // Make working (sec) 120, 72.. etc
    else if (
      splitNumbers[0] &&
      (Math.floor(splitNumbers[0]) > 60 || Math.floor(splitNumbers[0]) < 0)
    )
      return NaN;
    else if (splitNumbers[0]) sec += Math.floor(+splitNumbers[0]);
    if (
      splitNumbers[1] &&
      (Math.floor(splitNumbers[1]) > 60 || Math.floor(splitNumbers[1]) < 0)
    )
      return NaN;
    else if (splitNumbers[1]) sec += Math.floor(+splitNumbers[1]) * 60;
    if (splitNumbers[2] && Math.floor(splitNumbers[2]) < 0) return NaN;
    else if (splitNumbers[2]) sec += Math.floor(+splitNumbers[2]) * 3600;
    return sec * 1000;
  }
}
