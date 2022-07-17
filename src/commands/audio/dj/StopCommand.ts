import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../../structures";
import { PlayerDispatcher } from "../../../structures/audio/PlayerDispatcher";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
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
      CommandCategories.MUSIC,
      [CommandPermissions.DJ],
      {
        audioNode: true,
        trackPlaying: true,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceConnected: false,
        },
      },
      ["SEND_MESSAGES"]
    );
  }

  public async runCommand({ interaction }: ICommandContext): Promise<void> {
    const dispatcher: PlayerDispatcher = this.client.audio.getPlayerDispatcher(
      interaction.guildId
    );
    await interaction.reply({
      content: locale.format(interaction.locale, "CLEANED_AND_STOPPED"),
    });
    await dispatcher.cleanStop();
  }
}
