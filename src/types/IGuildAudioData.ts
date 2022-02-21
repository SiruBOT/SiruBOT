import { Schema } from "mongoose";
import type { IAudioTrack } from "./IAudioTrack";

export interface IGuildAudioData {
  _id: Schema.Types.ObjectId;
  discordGuildId: string;
  nowPlaying: IAudioTrack | null;
  queue: IAudioTrack[];
}
