// Importing the entire Shoukaku module and assigning it to the variable Shoukaku
import * as Shoukaku from "shoukaku";

// KafuuAudioTrack type
export type KafuuAudioTrack = {
  requestUserId: string; // The ID of the user who requested the track
  relatedTrack: boolean; // Whether the track is related to another track
  repeated: boolean; // Whether the track is repeated
} & Shoukaku.Track;

// Interface for KafuuJoinOptions, extends Shoukaku.VoiceChannelOptions
export type KafuuJoinOptions = {
  textChannelId: string; // The ID of the text channel where messages will be sent
} & Shoukaku.VoiceChannelOptions;

// Repeat mode enum
export enum KafuuRepeatMode {
  OFF, // Repeat mode is off
  ALL, // Repeat all tracks in the queue
  SINGLE, // Repeat the current track
}

// Playing state enum
export enum KafuuPlayingState {
  PLAYING, // Currently playing a track
  NOTPLAYING, // Not playing any tracks
  PAUSED, // Currently paused
}

/**
 *  Type definitions for shoukaku LavalinkResponse.info
 */
declare module "shoukaku" {
  // Declare module for ShoukakuTrackInfo
  export interface ShoukakuTrackInfo {
    sourceName?: string; // The name of the source
    identifier?: string; // The identifier of the track
    isSeekable?: boolean; // Whether the track is seekable
    author?: string; // The author of the track
    length?: number; // The length of the track in milliseconds
    isStream?: boolean; // Whether the track is a live stream
    position?: number; // The current position of the track in milliseconds
    title?: string; // The title of the track
    uri?: string; // The URI of the track
  }
}
