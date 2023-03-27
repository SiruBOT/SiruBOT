import Vibrant from "node-vibrant";
import { ColorResolvable, EmbedBuilder, EmbedFooterOptions } from "discord.js";
import { getLastCommit } from "git-last-commit";
import { ShoukakuTrackInfo } from "../types/";
import { BOT_NAME, DEFAULT_COLOR } from "../constant/MessageConstant";
import { version } from "../../package.json";

export class ExtendedEmbed extends EmbedBuilder {
  private versionInfo: string;
  constructor() {
    super();
    this.versionInfo = version;
    getLastCommit((err, commit) => {
      if (!err)
        this.versionInfo = `${version} (${commit.branch}-${commit.shortHash})`;
      else throw err;
    });
  }

  // TODO: Experimental
  public async setThumbnailAndColor(url: string): Promise<this> {
    const palette = await Vibrant.from(url).getPalette();
    this.setThumbnail(url);
    this.setColor((palette.Vibrant?.hex ?? DEFAULT_COLOR) as ColorResolvable);
    return this;
  }

  public setTrackThumbnail(info: ShoukakuTrackInfo): this {
    if (info.sourceName === "youtube" && info.identifier) {
      super.setThumbnail(
        `https://img.youtube.com/vi/${info.identifier}/maxresdefault.jpg`
      );
    }
    return this;
  }

  public override setFooter(options: EmbedFooterOptions | null): this {
    if (options?.text) {
      options.text = options.text + " | " + BOT_NAME + " " + this.versionInfo;
    }
    super.setFooter(options);
    return this;
  }
}
