import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../../structures";
import { PlayerDispatcher } from "../../../structures/audio/PlayerDispatcher";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../../types";
import { CommandRequirements } from "../../../types/CommandTypes/CommandRequirements";
import locale from "../../../locales";

export default class StopCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("stop")
      .setNameLocalizations({
        ko: "정지",
      })
      .setDescription("Stops the player and clean up guild queue.")
      .setDescriptionLocalizations({
        ko: "재생 중인 노래를 정지하고 대기열을 초기화해요.",
      });
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.DJ],
      CommandRequirements.TRACK_PLAYING | CommandRequirements.AUDIO_NODE,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: ICommandContext): Promise<void> {
    const dispatcher: PlayerDispatcher =
      this.client.audio.getPlayerDispatcherOrfail(interaction.guildId);
    await interaction.reply({
      content: locale.format(interaction.locale, "CLEANED_AND_STOPPED"),
    });
    await dispatcher.cleanStop();
  }
}
