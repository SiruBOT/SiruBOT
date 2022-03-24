import { Client, User } from "discord.js";
import { Formatter } from ".";
import { version } from "../../package.json";
import { BOT_NAME, DEFAULT_COLOR } from "../constant/Constants";
import { ReusableFormatFunction } from "../locales/LocalePicker";
import { IAudioTrack, IGuildAudioData } from "../types";
import { ExtendedEmbed } from "./ExtendedEmbed";

export class EmbedFactory {
  public static createEmbed(): ExtendedEmbed {
    return new ExtendedEmbed()
      .setFooter({ text: EmbedFactory.footerString })
      .setColor(DEFAULT_COLOR);
  }

  public static get footerString(): string {
    return `${BOT_NAME} - ${version}`;
  }

  public static async getTrackEmbed(
    client: Client,
    format: ReusableFormatFunction,
    track: IAudioTrack
  ): Promise<ExtendedEmbed> {
    const embed: ExtendedEmbed = EmbedFactory.createEmbed();
    if (!track.relatedTrack) {
      const userInfo: User | undefined =
        client.users.cache.get(track.requesterUserId) ??
        (await client.users.fetch(track.requesterUserId));
      if (userInfo) {
        embed.setAuthor({
          iconURL:
            userInfo.avatarURL({ size: 256 }) ?? userInfo.defaultAvatarURL,
          name: `${userInfo.username}#${userInfo.discriminator}`,
        });
      }
    } else {
      embed.setTitle(format("TRACK_EMBED_RELATED"));
    }
    if (track.shoukakuTrack.info.author) {
      embed.setFooter({
        text: format(
          "SOURCE",
          track.shoukakuTrack.info.author,
          EmbedFactory.footerString
        ),
      });
    }
    embed
      .setDescription(
        `[${Formatter.formatTrack(
          track.shoukakuTrack,
          format("LIVESTREAM")
        )}](${track.shoukakuTrack.info.uri})`
      )
      .setTrackThumbnail(track.shoukakuTrack.info);
    return embed;
  }

  public static async getNowplayingEmbed(
    client: Client,
    format: ReusableFormatFunction,
    nowplaying: IGuildAudioData["nowPlaying"],
    position: number | null
  ): Promise<ExtendedEmbed> {
    if (!nowplaying) {
      return this.createEmbed().setTitle(format("NOWPLAYING_NONE"));
    } else {
      const trackLength: number = nowplaying.shoukakuTrack.info.length ?? 0;
      const currentPosition: number = position ?? 0;
      const readablePosition: string = Formatter.humanizeSeconds(
        currentPosition / 1000
      );
      const readableTrackLength: string = Formatter.humanizeSeconds(
        trackLength / 1000
      );
      const trackEmbed: ExtendedEmbed = await this.getTrackEmbed(
        client,
        format,
        nowplaying
      );
      const formattedTrack = `**${Formatter.formatTrack(
        nowplaying.shoukakuTrack,
        format("LIVESTREAM"),
        false
      )}**`;
      const progressBar: string = Formatter.progressBar(
        currentPosition / trackLength
      );
      const urlLinkTitle: string = nowplaying.shoukakuTrack.info.uri
        ? `[${formattedTrack}](${nowplaying.shoukakuTrack.info.uri})`
        : formattedTrack;
      trackEmbed.setDescription(
        `${urlLinkTitle}\n${readablePosition} ${progressBar} ${readableTrackLength}`
      );
      return trackEmbed;
    }
  }
}
