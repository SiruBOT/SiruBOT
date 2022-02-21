// Impl
// queue: { type: Array, default: [] },
// nowplaying: { type: Object, default: { track: null } },

// nowplayingPosition: { type: Number, default: 0 }, Redis
import { Schema, model } from "mongoose";
import { IGuildAudioData } from "../../../types/";

const GuildAudioDataSchema: Schema = new Schema<IGuildAudioData>({
  _id: Schema.Types.ObjectId,
  discordGuildId: {
    type: String,
  },
  nowPlaying: {
    type: Object,
    default: null,
  },
  queue: {
    type: [], // WTF
    default: [],
  },
});

const GuildAudioDataModel = model<IGuildAudioData>(
  "GuildAudioData",
  GuildAudioDataSchema
);

export default GuildAudioDataModel;
