// Impl
// queue: { type: Array, default: [] },
// nowplaying: { type: Object, default: { track: null } },

// nowplayingPosition: { type: Number, default: 0 }, Redis
import { type ShoukakuTrack } from "shoukaku";
import { Schema, model } from "mongoose";

interface AudioTrack {
  requesterUserId: string;
  shoukakuTrack: ShoukakuTrack;
}

interface GuildAudioData {
  nowPlaying: AudioTrack | null;
  queue: AudioTrack[];
}

const GuildAudioDataSchema: Schema = new Schema<GuildAudioData>({
  nowPlaying: {
    type: Object,
    default: null,
  },
  queue: {
    type: [], // WTF
    default: [],
  },
});

const GuildAudioDataModel = model<GuildAudioData>(
  "GuildAudioData",
  GuildAudioDataSchema
);

export default GuildAudioDataModel;
