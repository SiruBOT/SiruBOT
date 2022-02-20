// Impl
// queue: { type: Array, default: [] },
// nowplaying: { type: Object, default: { track: null } },

// nowplayingPosition: { type: Number, default: 0 }, Redis
import { type ShoukakuTrack } from "shoukaku";
import { Schema, model } from "mongoose";
interface AudioPlaylist {
  title: string;
  entries: ShoukakuTrack[];
  playlistAuthorId: string;
  likes: number;
  playlistId: string;
}

const AudioPlaylistSchema: Schema = new Schema<AudioPlaylist>({
  title: { type: String, required: true },
  entries: { type: [], required: true },
  playlistAuthorId: { type: String, required: true },
  playlistId: { type: String, required: true },
});

const AudioPlaylistModel = model<AudioPlaylist>(
  "AudioPlaylist",
  AudioPlaylistSchema
);

export default AudioPlaylistModel;
