import type { BaseCommand } from ".";
import type Discord from "discord.js";

export class InteractionRouter {
  static async routeInteraction(
    interaction: Discord.Interaction,
    command: BaseCommand
  ): Promise<void> {
    if (interaction.isCommand())
      return await command.handleCommand(interaction);

    if (interaction.isAutocomplete())
      return await command.handleAutocomplete(interaction);

    // eslint-disable-next-line prettier/prettier
    if (interaction.isButton()) 
      return await command.handleButton(interaction);

    if (interaction.isContextMenu())
      return await command.handleContextMenu(interaction);

    if (interaction.isMessageComponent())
      return await command.handleMessageComponent(interaction);

    if (interaction.isSelectMenu())
      return await command.handleSelectMenu(interaction);

    if (interaction.isUserContextMenu())
      return await command.handleUserContextMenu(interaction);

    throw new Error("Unknown interaction type");
  }
}
