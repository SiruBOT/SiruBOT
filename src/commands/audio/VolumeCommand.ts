import { SlashCommandBuilder } from "@discordjs/builders";
import * as Discord from "discord.js";
import { BaseCommand, Client } from "../../structures";
import { CommandCategories, CommandPermissions } from "../../types";

export default class VolumeCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("volume")
      .setDescription("볼륨을 설정하거나 볼 수 있어요")
      .addStringOption((option) => {
        return option
          .setName("volume")
          .setDescription("볼륨 (1~150)")
          .setRequired(false);
      });
    super(
      slashCommand,
      client,
      CommandCategories.GENERAL,
      [CommandPermissions.EVERYONE],
      {
        audioNode: false,
        trackPlaying: false,
        guildPermissions: ["SEND_MESSAGES"],
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceConnected: false,
        },
      }
    );
  }

  public async runCommand(
    interaction: Discord.CommandInteraction
  ): Promise<void> {}
}
