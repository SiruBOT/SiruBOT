import { Track } from "shoukaku";
import { IAudioTrack } from "../../types";
export class AudioTools {
  public static getAudioTrack(
    track: Track,
    requesterUserId: string,
    relatedTrack = false,
    repeated = false
  ): IAudioTrack {
    return {
      track,
      relatedTrack,
      repeated,
      requesterUserId,
    };
  }
}
