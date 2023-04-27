// |Good parts:
// |- The code is using TypeScript, which provides type safety and helps catch errors during development.
// |- The code is using interfaces to define the shape of the `GuildAudioData` object, which makes it easier to understand and maintain the code.
// |- The `GuildAudioData` interface is importing the `KafuuAudioTrack` type from a separate file, which promotes code reusability and modularity.
// |
// |Bad parts:
// |- It's not clear what the purpose of the `GuildAudioData` object is without additional context.
// |- The `nowPlaying` and `position` properties are nullable, which could lead to errors if they are not properly handled in the code.
// |- The `positionUpdatedAt`, `createdAt`, and `updatedAt` properties are not explained or documented, which could make it difficult for other developers to understand their purpose.
// | - GPT CodeReview
import type { KafuuAudioTrack } from "@/types/audio";
// This interface defines the structure of the audio data for a Discord guild.
export type GuildAudioData = {
  // The ID of the Discord guild associated with this audio data.
  discordGuildId: string;
  // The currently playing audio track, if any.
  nowPlaying: KafuuAudioTrack | null;
  // The position in the currently playing audio track, if any.
  position: number | null;
  // The time at which the position in the currently playing audio track was last updated.
  positionUpdatedAt: Date;
  // The queue of upcoming audio tracks to play.
  queue: KafuuAudioTrack[];
  // The time at which this audio data was created.
  createdAt: Date;
  // The time at which this audio data was last updated.
  updatedAt: Date;
};
