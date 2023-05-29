import Vibrant from "node-vibrant";
import { EmbedBuilder, ColorResolvable, EmbedFooterOptions } from "discord.js";
import { Track } from "shoukaku";

import { ReusableFormatFunc } from "@/types/locales";
import { DEFAULT_COLOR, BOT_NAME } from "@/constants/message";
import { GuildAudioData } from "@/types/models/audio";
import { KafuuClient } from "@/structures/KafuuClient";
import { KafuuAudioTrack } from "@/types/audio";
import {
  formatTrack,
  humanizeSeconds,
  emojiProgressBar,
} from "@/utils/formatter";

import { getGitHash } from "@/utils/version";
import { version } from "../../package.json";
import { decode } from "@sirubot/lavalink-encoding";

const versionInfo = `${version} (${getGitHash()})`;

export class ExtendedEmbed extends EmbedBuilder {
  constructor() {
    super();
  }

  // TODO: Experimental
  public async setThumbnailAndColor(url: string): Promise<this> {
    const palette = await Vibrant.from(url).getPalette();
    this.setThumbnail(url);
    this.setColor((palette.Vibrant?.hex ?? DEFAULT_COLOR) as ColorResolvable);
    return this;
  }

  public async setImageAndColor(url: string): Promise<this> {
    const palette = await Vibrant.from(url).getPalette();
    this.setThumbnail(url);
    this.setColor((palette.Vibrant?.hex ?? DEFAULT_COLOR) as ColorResolvable);
    return this;
  }

  public setTrackThumbnail(track: Track): this {
    return this._setTrackImage(track, this.setThumbnail);
  }

  public setTrackImage(track: Track): this {
    return this._setTrackImage(track, this.setImage);
  }

  public getTrackImage({ info, track }: Track): string | null {
    switch (true) {
      case info.sourceName == "youtube" && !!info.identifier:
        return `https://i3.ytimg.com/vi/${info.identifier}/maxresdefault.jpg`;
      case info.sourceName == "spotify":
        const { spotifyInfo } = decode(track);
        return !spotifyInfo?.thumbnail ? null : spotifyInfo.thumbnail;
      default:
        return null;
    }
  }

  private _setTrackImage(
    track: Track,
    setMethod: (url: string | null) => this
  ): this {
    setMethod.call(this, this.getTrackImage(track));
    return this;
  }

  public override setFooter(options?: EmbedFooterOptions | null): this {
    if (options?.text) {
      options.text = options.text + " | " + BOT_NAME + " " + versionInfo;
    } else {
      options = {
        text: BOT_NAME + " " + versionInfo,
      };
    }
    super.setFooter(options);
    return this;
  }
}

export class EmbedFactory {
  public static createEmbed(): ExtendedEmbed {
    return new ExtendedEmbed().setColor(DEFAULT_COLOR);
  }

  public static async getTrackEmbed(
    client: KafuuClient,
    format: ReusableFormatFunc,
    track: KafuuAudioTrack
  ): Promise<ExtendedEmbed> {
    const embed: ExtendedEmbed = EmbedFactory.createEmbed();
    if (!track.relatedTrack) {
      const userInfo =
        client.users.cache.get(track.requestUserId) ??
        (await client.users.fetch(track.requestUserId));
      if (userInfo) {
        embed.setAuthor({
          iconURL:
            userInfo.avatarURL({ size: 256 }) ?? userInfo.defaultAvatarURL,
          name: `${userInfo.username}#${userInfo.discriminator}`,
        });
      }
    }
    if (track.info.author) {
      embed.setFooter({
        text: format("SOURCE", track.info.author),
      });
    }
    embed
      .setDescription(
        `[${formatTrack(track, { streamString: format("LIVESTREAM") })}](${
          track.info.uri
        })`
      )
      .setTrackThumbnail(track);
    return embed;
  }

  public static async buildNowplayingEmbed(
    client: KafuuClient,
    format: ReusableFormatFunc,
    nowplaying: GuildAudioData["nowPlaying"],
    position: number | null,
    remainTracks?: number,
    remainTimes?: number
  ): Promise<ExtendedEmbed> {
    if (!nowplaying) {
      return this.createEmbed().setTitle(format("NOWPLAYING_NONE"));
    } else {
      const trackLength: number = nowplaying.info.length ?? 0;
      const currentPosition: number = position ?? 0;
      const readablePosition: string = humanizeSeconds(currentPosition, true);
      const readableTrackLength: string = nowplaying.info.isStream
        ? `[${format("LIVESTREAM")}]`
        : humanizeSeconds(trackLength, true);
      const trackEmbed: ExtendedEmbed = await this.getTrackEmbed(
        client,
        format,
        nowplaying
      );
      const formattedTrack = `**${formatTrack(nowplaying, {
        streamString: format("LIVESTREAM"),
        showLength: false,
      })}**`;
      const progressBar: string = emojiProgressBar(
        currentPosition / trackLength
      );
      const urlLinkTitle: string = nowplaying.info.uri
        ? `[${formattedTrack}](${nowplaying.info.uri})`
        : formattedTrack;
      trackEmbed.setDescription(
        `${urlLinkTitle}\n${readablePosition}  ${progressBar}  ${readableTrackLength}`
      );
      const footerItems: string[] = [];
      if (nowplaying.info.author) {
        footerItems.push(format("SOURCE", nowplaying.info.author));
      }
      if (nowplaying.relatedTrack) {
        footerItems.push(format("TRACK_EMBED_RELATED"));
      }
      if (remainTracks && remainTimes) {
        footerItems.push(
          format(
            "REMAIN_TRACKS",
            remainTracks.toString(),
            humanizeSeconds(remainTimes, true)
          )
        );
      }
      trackEmbed.setFooter({ text: footerItems.join(" | ") });
      return trackEmbed;
    }
  }
}
