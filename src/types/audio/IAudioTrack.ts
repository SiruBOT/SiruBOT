import type { ShoukakuTrack } from "shoukaku";

export interface IAudioTrack {
  requesterUserId: string;
  relatedTrack: boolean;
  repeated: boolean;
  shoukakuTrack: ShoukakuTrack;
}
