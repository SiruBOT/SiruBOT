import { Document, Schema, model } from "mongoose";
import { IAudioPlaylist } from "../../../types";

export interface AudioPlaylistDocument extends IAudioPlaylist, Document {}

const AudioPlaylistSchema: Schema<AudioPlaylistDocument> =
  new Schema<AudioPlaylistDocument>(
    {
      title: { type: String, required: true },
      entries: { type: [], required: true },
      playlistAuthorId: { type: String, required: true },
      playlistId: { type: String, required: true },
    },
    { timestamps: true }
  );

export default model<IAudioPlaylist>("AudioPlaylist", AudioPlaylistSchema);
