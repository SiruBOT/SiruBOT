import { MessageEmbed } from "discord.js";
import { version } from "../../package.json";
import { BOT_NAME, DEFAULT_COLOR } from "../constant/Constants";
export class EmbedFactory {
  static createEmbed(): MessageEmbed {
    return new MessageEmbed()
      .setFooter({ text: `${BOT_NAME} - ${version}` })
      .setColor(DEFAULT_COLOR);
  }
}
