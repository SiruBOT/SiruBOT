import { Document, Schema, model } from "mongoose";
import { IAudioPlaylist } from "../../../types";

export interface AudioPlaylistDocument extends IAudioPlaylist, Document {}

const AudioPlaylistSchema: Schema<AudioPlaylistDocument> =
  new Schema<AudioPlaylistDocument>({
    title: { type: String, required: true },
    entries: { type: [], required: true },
    playlistAuthorId: { type: String, required: true },
    playlistId: { type: String, required: true },
    createdAt: { type: Number, default: 0 },
  });

export default model<IAudioPlaylist>("AudioPlaylist", AudioPlaylistSchema);
