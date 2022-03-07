import { Client, MessageEmbed, User } from "discord.js";
import { ShoukakuTrack } from "shoukaku";
import { Formatter } from ".";
import { version } from "../../package.json";
import { BOT_NAME, DEFAULT_COLOR } from "../constant/Constants";
import { ReusableFormatFunction } from "../locales/LocalePicker";
import { IAudioTrack } from "../types";
import { ExtendedEmbed } from "./ExtendedEmbed";

//
export class EmbedFactory {
  static createEmbed(): ExtendedEmbed {
    return new ExtendedEmbed()
      .setFooter({ text: EmbedFactory.footerString })
      .setColor(DEFAULT_COLOR);
  }

  static get footerString(): string {
    return `${BOT_NAME} - ${version}`;
  }

  static async getTrackEmbed(
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
}
