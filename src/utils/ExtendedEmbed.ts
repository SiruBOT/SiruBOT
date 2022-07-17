import { MessageEmbed } from "discord.js";
import { ShoukakuTrackInfo } from "../types/";

export class ExtendedEmbed extends MessageEmbed {
  constructor() {
    super();
  }

  setTrackThumbnail(info: ShoukakuTrackInfo): this {
    if (info.sourceName === "youtube" && info.identifier) {
      this.setThumbnail(
        `https://img.youtube.com/vi/${info.identifier}/maxresdefault.jpg`
      );
    }
    return this;
  }
}
