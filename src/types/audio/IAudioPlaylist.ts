import { type Base64String } from "shoukaku";

export interface IAudioPlaylist {
  title: string;
  entries: Base64String[];
  playlistAuthorId: string;
  likes: number;
  playlistId: string;
  createdAt: number;
}
