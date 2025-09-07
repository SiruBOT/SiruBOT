import {
  PROGRESS_BAR_BLACK,
  PROGRESS_BAR_EMOJI_COUNT,
  PROGRESS_BAR_END_BLACK,
  PROGRESS_BAR_END_MIDDLE_WHITE,
  PROGRESS_BAR_END_WHITE,
  PROGRESS_BAR_START_BLACK,
  PROGRESS_BAR_START_SINGLE_WHITE,
  PROGRESS_BAR_START_WHITE,
  PROGRESS_BAR_WHITE,
} from "./constants";
import { Track } from "lavalink-client";
import { formatTime } from "./time";

export function emojiProgressBar(percent: number) {
  let str = "";
  const p = Math.floor(percent * PROGRESS_BAR_EMOJI_COUNT); // Calculate current progress (0 ~ PROGRESS_BAR_EMOJI_COUNT)

  if (p === 0) {
    str += PROGRESS_BAR_START_BLACK; // If progress is 0, add black start progress bar emoji
  } else if (p === 1) {
    str += PROGRESS_BAR_START_SINGLE_WHITE; // If progress is 1, add single white start progress bar emoji
  } else {
    str += PROGRESS_BAR_START_WHITE; // Otherwise, add white start progress bar emoji
  }

  for (let i = 1; i < PROGRESS_BAR_EMOJI_COUNT - 1; i++) {
    if (p > i) {
      if (p - 1 === i) {
        str += PROGRESS_BAR_END_MIDDLE_WHITE; // If progress is greater than i and p - 1 is equal to i, add middle white end progress bar emoji
      } else {
        str += PROGRESS_BAR_WHITE; // Otherwise, add white progress bar emoji
      }
    } else {
      str += PROGRESS_BAR_BLACK; // If progress is less than or equal to i, add black progress bar emoji
    }
  }

  if (p >= PROGRESS_BAR_EMOJI_COUNT - 1) {
    str += PROGRESS_BAR_END_WHITE; // If progress is greater than or equal to PROGRESS_BAR_EMOJI_COUNT - 1, add white end progress bar emoji
  } else {
    str += PROGRESS_BAR_END_BLACK; // Otherwise, add black end progress bar emoji
  }

  return str; // Return the progress bar emoji string
}

type FormatTrackOptions = {
  showLength?: boolean;
  withMarkdownURL?: boolean;
};

const MAX_TRACK_URL_LENGTH = 70;
export function formatTrack(
  track: Track,
  options?: FormatTrackOptions,
): string {
  const {
    title,
    duration,
    isStream,
  }: {
    title?: string;
    duration?: number;
    isStream?: boolean;
  } = track.info;
  const { showLength, withMarkdownURL, streamString } = {
    showLength: true,
    streamString: "LIVE",
    withMarkdownURL: false,
    ...options,
  };
  return !withMarkdownURL
    ? `${title.trim() ?? "제목 없음"}` // If withMarkdownURL is false, format track string without markdown URL
    : // If track uri length is greater than MAX_TRACK_URL_LENGTH, return not formatted track title
      track.info.uri.length > MAX_TRACK_URL_LENGTH
      ? `${title.trim() ?? "제목 없음"}`
      : `[${title.trim() ?? "제목 없음"}${
          showLength
            ? ` [${
                duration
                  ? isStream
                    ? streamString
                    : formatTime(duration / 1000) // If length is not null or undefined and isStream is false, convert length to human readable format
                  : "N/A" // Otherwise, add "N/A"
              }]`
            : ""
        }](${track.info.uri})`;
}
