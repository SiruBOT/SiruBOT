import { ShoukakuTrack } from "shoukaku";
import {
  EMOJI_VOLUME_LOUD,
  EMOJI_VOLUME_SMALL,
  EMOJI_VOLUME_MUTE,
  PROGRESS_BAR_START_WHITE,
  PROGRESS_BAR_END_WHITE,
  PROGRESS_BAR_WHITE,
  PROGRESS_BAR_START_BLACK,
  PROGRESS_BAR_END_BLACK,
  PROGRESS_BAR_BLACK,
  PROGRESS_BAR_START_SINGLE_WHITE,
  PROGRESS_BAR_END_MIDDLE_WHITE,
} from "../constant/MessageConstant";
const PROGRESS_BAR_EMOJI_COUNT = 10;
export class Formatter {
  /**
   * Convert seconds to readble format (like 00:00:00)
   * @param sec Seconds to covert
   * @returns {string} readable string
   */
  public static humanizeSeconds(sec: number): string {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor(sec / 60) % 60;
    const seconds = Math.floor(sec % 60);

    return [hours, minutes, seconds]
      .map((v) => (v < 10 ? "0" + v : v))
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  }

  public static volumeEmoji(vol: number): string {
    if (vol > 60) return EMOJI_VOLUME_LOUD;
    if (vol > 0) return EMOJI_VOLUME_SMALL;
    else return EMOJI_VOLUME_MUTE;
  }

  public static formatTrack(
    track: ShoukakuTrack,
    streamString = "Live Stream",
    showLength = true
  ): string {
    const {
      title,
      length,
      isStream,
    }: {
      title?: string;
      length?: number;
      isStream?: boolean;
    } = track.info;
    return `${title ?? "No title"} ${
      showLength
        ? `[${
            length
              ? isStream
                ? streamString
                : this.humanizeSeconds(length / 1000)
              : "N/A"
          }]`
        : ""
    }`;
  }

  static progressBar(percent: number) {
    let str = "";
    const p = Math.floor(percent * PROGRESS_BAR_EMOJI_COUNT); // Current progress (0 ~ PROGRESS_BAR_EMOJI_COUNT)
    for (let i = 0; i < PROGRESS_BAR_EMOJI_COUNT; i++) {
      if (i == 0) {
        if (p == 0) {
          str += PROGRESS_BAR_START_BLACK;
        } else if (p == 1) {
          str += PROGRESS_BAR_START_SINGLE_WHITE;
        } else {
          str += PROGRESS_BAR_START_WHITE;
        }
      } else {
        if (p > i) {
          if (p - 1 == i) {
            if (i == PROGRESS_BAR_EMOJI_COUNT - 1) {
              str += PROGRESS_BAR_END_WHITE;
            } else {
              str += PROGRESS_BAR_END_MIDDLE_WHITE;
            }
          } else {
            str += PROGRESS_BAR_WHITE;
          }
        } else {
          if (i < PROGRESS_BAR_EMOJI_COUNT - 1) {
            str += PROGRESS_BAR_BLACK;
          } else {
            str += PROGRESS_BAR_END_BLACK;
          }
        }
      }
    }
    return str;
  }
}
