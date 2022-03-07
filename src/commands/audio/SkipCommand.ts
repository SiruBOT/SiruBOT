import { SlashCommandBuilder } from "@discordjs/builders";
import * as Discord from "discord.js";
import { BaseCommand, Client } from "../../structures";
import { CommandCategories, CommandPermissions } from "../../types";

export default class VolumeCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("skip")
      .setDescription("노래를 건너뛸 수 있어요")
      .addBooleanOption((option) => {
        return option
          .setName("forceskip")
          .setDescription("강제로 건너뛰기")
          .setRequired(false);
      })
      .addIntegerOption((input) => {
        return input
          .setName("to")
          .setDescription("대기열의 특정 노래로 건너뛸수 있어요")
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