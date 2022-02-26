import { ShoukakuTrack } from "shoukaku";

export class UnitsConverter {
  public static humanizeSeconds(sec: number): string {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor(sec / 60) % 60;
    const seconds = sec % 60;

    return [hours, minutes, seconds]
      .map((v) => (v < 10 ? "0" + v : v))
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  }

  public static formatTrack(
    track: ShoukakuTrack,
    streamString = "Live Stream"
  ): string {
    const {
      title,
      length,
      isStream,
    }: {
      title?: string;
      length?: number;
      isStream?: boolean;
    } = track.info;
    return `**${title ?? "No title"} [${
      length
        ? isStream
          ? streamString
          : this.humanizeSeconds(length / 1000)
        : "N/A"
    }]**`;
  }
}
