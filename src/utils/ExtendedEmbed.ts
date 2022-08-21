import { ColorResolvable, EmbedBuilder, EmbedFooterOptions } from "discord.js";
import { ShoukakuTrackInfo } from "../types/";
import Vibrant from "node-vibrant";
import { BOT_NAME, DEFAULT_COLOR } from "../constant/MessageConstant";
import { version } from "../../package.json";
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
      super.setThumbnail(
        `https://img.youtube.com/vi/${info.identifier}/maxresdefault.jpg`
      );
    }
    return this;
  }

  setFooter(options: EmbedFooterOptions | null): this {
    if (options?.text) {
      options.text = options.text + " | " + BOT_NAME + " " + version;
    }
    super.setFooter(options);
    return this;
  }
}
