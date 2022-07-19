import { ColorResolvable, EmbedBuilder } from "discord.js";
import { ShoukakuTrackInfo } from "../types/";
import Vibrant from "node-vibrant";
import { DEFAULT_COLOR } from "../constant/MessageConstant";

export class ExtendedEmbed extends EmbedBuilder {
  constructor() {
    super();
  }

  // TODO: Experimental
  async setThumbnailAndColor(url: string): Promise<this> {
    const palette = await Vibrant.from(url).getPalette();
    this.setThumbnail(url);
    this.setColor((palette.Vibrant?.hex ?? DEFAULT_COLOR) as ColorResolvable);
    return this;
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
