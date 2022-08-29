// Impl
// queue: { type: Array, default: [] },
// nowplaying: { type: Object, default: { track: null } },

// nowplayingPosition: { type: Number, default: 0 }, Redis
import { Document, Schema, model } from "mongoose";
import { IGuildAudioData } from "../../../types/";

export interface GuildAudioDataDocument extends IGuildAudioData, Document {}

const GuildAudioDataSchema: Schema<GuildAudioDataDocument> =
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
  );

export default model<IGuildAudioData>("GuildAudioData", GuildAudioDataSchema);
