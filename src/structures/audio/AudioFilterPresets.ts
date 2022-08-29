import { AudioEqualizerBands } from "./AudioEqualizerBands";
// https://github.com/freyacodes/Lavalink/blob/master/IMPLEMENTATION.md
// Bands: [0 - 15]
enum BassBoostPresetName {
  Soft = "Soft",
  Hard = "Hard",
  Russia = "Russia",
}

const BassBoostPresets: Map<BassBoostPresetName, AudioEqualizerBands> = new Map<
  BassBoostPresetName,
  AudioEqualizerBands
>();
// TODO: 언젠가의 나야 부탁해
// BassBoostPresets.set(BassBoostPresetName.Soft);

export { BassBoostPresets, BassBoostPresetName };
