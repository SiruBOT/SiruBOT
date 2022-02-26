import type { IAudioTrack } from "./IAudioTrack";

export interface IGuildAudioData {
  discordGuildId: string;
  nowPlaying: IAudioTrack | null;
  queue: IAudioTrack[];
}
