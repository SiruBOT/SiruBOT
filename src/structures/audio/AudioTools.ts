import { MessageEmbed, User } from "discord.js";
import { ShoukakuTrack } from "shoukaku";
export class AudioTools {
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
