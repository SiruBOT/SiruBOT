import Discord, { CommandInteraction } from "discord.js";

export class MessageUtil {
  public static followUpOrEditReply(
    interaction: CommandInteraction<"cached">,
    options: string | Discord.MessagePayload | Discord.InteractionReplyOptions
  ): Promise<Discord.Message> {
    if (interaction.replied) {
      return interaction.followUp(options);
    } else {
      return interaction.editReply(options);
    }
  }
}
