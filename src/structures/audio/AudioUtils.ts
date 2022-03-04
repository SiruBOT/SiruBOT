import { ShoukakuTrack } from "shoukaku";
import { IAudioTrack } from "../../types";
// import { ActionRow, ButtonComponent } from "@discordjs/builders";
import { MessageEmbed, User } from "discord.js";

export class AudioUtils {
  static getAudioTrack(
    shoukakuTrack: ShoukakuTrack,
    requesterUserId: string,
    relatedTrack = false,
    repeated = false
  ): IAudioTrack {
    return {
      shoukakuTrack,
      relatedTrack,
      repeated,
      requesterUserId,
    };
  }

  static getNowPlayingEmbed(
    track: ShoukakuTrack,
    requestUser: User
  ): MessageEmbed {
    const embed = new MessageEmbed()
      .setTitle(requestUser.id)
      .setColor("#FFBADA")
      .setDescription(track.info.title || "Title not found.");
    return embed;
  }
}
