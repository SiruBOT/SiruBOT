import { Document, Schema, model } from "mongoose";
import { GuildAudioData } from "@/types/models/audio";

export interface GuildAudioDataDocument extends GuildAudioData, Document {}

export default model<GuildAudioData>(
  "GuildAudioData",
  new Schema<GuildAudioDataDocument>(
    {
      discordGuildId: {
        required: true,
        type: String,
      },
      nowPlaying: {
        type: Object,
        default: null,
      },
      position: {
        type: Number,
        default: 0,
      },
      positionUpdatedAt: {
        type: Date,
        default: new Date(0),
      },
      queue: {
        type: [],
        default: [],
      },
    },
    { timestamps: true }
  )
);
