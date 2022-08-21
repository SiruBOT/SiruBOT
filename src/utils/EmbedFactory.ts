import { Client, User } from "discord.js";
import { Formatter } from ".";
import { DEFAULT_COLOR } from "../constant/MessageConstant";
import { ReusableFormatFunction } from "../locales/LocalePicker";
import { IAudioTrack, IGuildAudioData } from "../types";
import { ExtendedEmbed } from "./ExtendedEmbed";

export class EmbedFactory {
  public static createEmbed(): ExtendedEmbed {
    return new ExtendedEmbed().setColor(DEFAULT_COLOR);
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
    }
    if (track.track.info.author) {
      embed.setFooter({
        text: format("SOURCE", track.track.info.author),
      });
    }
    embed
      .setTitle(`${Formatter.formatTrack(track.track, format("LIVESTREAM"))}`)
      .setURL(track.track.info.uri)
      .setTrackThumbnail(track.track.info);
    return embed;
  }

  public static async getNowplayingEmbed(
    client: Client,
    format: ReusableFormatFunction,
    nowplaying: IGuildAudioData["nowPlaying"],
    position: number | null,
    remainTracks?: number,
    remainTimes?: number
  ): Promise<ExtendedEmbed> {
    if (!nowplaying) {
      return this.createEmbed().setTitle(format("NOWPLAYING_NONE"));
    } else {
      const trackLength: number = nowplaying.track.info.length ?? 0;
      const currentPosition: number = position ?? 0;
      const readablePosition: string = Formatter.humanizeSeconds(
        currentPosition / 1000
      );
      const readableTrackLength: string = nowplaying.track.info.isStream
        ? `[${format("LIVESTREAM")}]`
        : Formatter.humanizeSeconds(trackLength / 1000);
      const trackEmbed: ExtendedEmbed = await this.getTrackEmbed(
        client,
        format,
        nowplaying
      );
      const formattedTrack = `**${Formatter.formatTrack(
        nowplaying.track,
        format("LIVESTREAM"),
        false
      )}**`;
      const progressBar: string = Formatter.progressBar(
        currentPosition / trackLength
      );
      const urlLinkTitle: string = nowplaying.track.info.uri
        ? `[${formattedTrack}](${nowplaying.track.info.uri})`
        : formattedTrack;
      trackEmbed.setDescription(
        `${urlLinkTitle}\n${readablePosition}  ${progressBar}  ${readableTrackLength}`
      );
      const footerItems: string[] = [];
      if (nowplaying.track.info.author) {
        footerItems.push(format("SOURCE", nowplaying.track.info.author));
      }
      if (nowplaying.relatedTrack) {
        footerItems.push(format("TRACK_EMBED_RELATED"));
      }
      if (remainTracks && remainTimes) {
        footerItems.push(
          format(
            "REMAIN_TRACKS",
            remainTracks.toString(),
            Formatter.humanizeSeconds(remainTimes)
          )
        );
      }
      trackEmbed.setFooter({ text: footerItems.join(" | ") });
      return trackEmbed;
    }
  }
}
