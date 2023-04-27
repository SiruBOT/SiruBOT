import Vibrant from "node-vibrant";
import { EmbedBuilder, ColorResolvable, EmbedFooterOptions } from "discord.js";
import { ShoukakuTrackInfo } from "shoukaku";

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

  public setTrackThumbnail(info: ShoukakuTrackInfo): this {
    if (info.sourceName === "youtube" && info.identifier) {
      super.setThumbnail(
        `https://img.youtube.com/vi/${info.identifier}/maxresdefault.jpg`
      );
    }
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
        `[${formatTrack(track, format("LIVESTREAM"))}](${track.info.uri})`
      )
      .setTrackThumbnail(track.info);
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
      const formattedTrack = `**${formatTrack(
        nowplaying,
        format("LIVESTREAM"),
        {
          showLength: false,
        }
      )}**`;
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
