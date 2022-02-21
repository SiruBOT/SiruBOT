import type { ShoukakuTrack } from "shoukaku";

export interface IAudioTrack {
  requesterUserId: string;
  shoukakuTrack: ShoukakuTrack;
}
