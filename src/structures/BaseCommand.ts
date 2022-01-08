import type { SlashCommandBuilder } from "@discordjs/builders";
import type * as Discord from "discord.js";
import type {
  CommandCategories,
  CommandPermissions,
  ICommandRequirements,
} from "../types";

export class BaseCommand {
  slashCommand: SlashCommandBuilder;
  category: CommandCategories;
  permissions: CommandPermissions[];
  requirements: ICommandRequirements;

  constructor(
    slashCommand: SlashCommandBuilder,
    category: CommandCategories,
    permissions: CommandPermissions[],
    requirements: ICommandRequirements
  ) {
    this.slashCommand = slashCommand;
    this.category = category;
    this.permissions = permissions;
    this.requirements = requirements;
  }

  async handleCommand(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.CommandInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#onCommand");
  }

  async handleAutocomplete(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.AutocompleteInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#onAutocomplete");
  }

  async handleButton(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.ButtonInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#onButton");
  }

  async handleContextMenu(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.ContextMenuInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#onContextMenu");
  }

  async handleMessageComponent(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.MessageComponentInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#onMessageComponent");
  }

  async handleSelectMenu(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.SelectMenuInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#onSelectMenu");
  }

  async handleUserContextMenu(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.UserContextMenuInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#onUserContextMenu");
  }
}
