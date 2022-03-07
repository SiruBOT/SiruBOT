import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  HandledCommandInteraction,
  IGuildAudioData,
} from "../../types";

export default class QueueCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("queue")
      .setDescription("대기열의 노래들을 보여드려요");
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
    const guildAudio: IGuildAudioData | undefined =
      await this.client.audio.dispatchers
        .get(interaction.guildId)
        ?.queue.getGuildAudioData();
    if (!guildAudio) throw new Error("guildAudioData not found");
    await interaction.reply({
      content: guildAudio.queue
        .map((v, i) => {
          return `${i} ${v.shoukakuTrack.info.title}`;
        })
        .join("\n "),
    });
  }
}
