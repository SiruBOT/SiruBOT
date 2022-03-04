import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../../structures";
import { PlayerDispatcher } from "../../../structures/audio/PlayerDispatcher";
import {
  CommandCategories,
  CommandPermissions,
  HandledCommandInteraction,
} from "../../../types";
import locale from "../../../locales";

export default class StopCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("stop")
      .setDescription("재생 중인 노래를 정지해요");
    super(
      slashCommand,
      client,
      CommandCategories.GENERAL,
      [CommandPermissions.EVERYONE],
      {
        audioNode: true,
        trackPlaying: true,
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
    interaction: HandledCommandInteraction
  ): Promise<void> {
    const dispatcher: PlayerDispatcher | undefined =
      this.client.audio.dispatchers.get(interaction.guildId);
    if (!dispatcher) throw new Error("PlayerDispatcher not found.");
    await interaction.reply({
      content: locale.format(interaction.locale, "CLEANED_AND_STOPPED"),
    });
    await dispatcher.cleanStop();
  }
}
