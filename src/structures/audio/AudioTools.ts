import { ShoukakuTrack } from "shoukaku";
import { IAudioTrack } from "../../types";
export class AudioTools {
  public static getAudioTrack(
    shoukakuTrack: ShoukakuTrack,
    requesterUserId: string,
    relatedTrack = false,
    repeated = false
  ): IAudioTrack {
    return {
      shoukakuTrack,
      relatedTrack,
      repeated,
      requesterUserId,
    };
  }
}
