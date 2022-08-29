import type { IAudioTrack } from "./IAudioTrack";

export interface IGuildAudioData {
  discordGuildId: string;
  nowPlaying: IAudioTrack | null;
  position: number | null;
  positionUpdatedAt: Date;
  queue: IAudioTrack[];
  createdAt: Date;
  updatedAt: Date;
}
