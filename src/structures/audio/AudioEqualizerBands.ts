import { Band } from "shoukaku";

export class AudioEqualizerBands {
  public bands: Band[];
  public gainMultiplier: number;
  constructor(initialBands?: Band[]) {
    this.bands = initialBands ?? [];
  }

  public setMultiplier(multiplier: number): number {
    this.gainMultiplier = multiplier;
    this.bands = this.bands.map((e) => {
      e.gain * this.gainMultiplier;
      return e;
    });
    return multiplier;
  }
}
