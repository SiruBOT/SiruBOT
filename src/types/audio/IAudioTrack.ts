import type { Track } from "shoukaku";

export interface IAudioTrack {
  requesterUserId: string;
  relatedTrack: boolean;
  repeated: boolean;
  track: Track;
}
