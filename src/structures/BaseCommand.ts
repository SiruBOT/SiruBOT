/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import type * as Discord from "discord.js";
import type { KafuuClient } from ".";
import type {
  KafuuCommandCategory,
  KafuuCommandContext,
} from "@/types/command";
import { KafuuCommandPermission } from "@/types/command";

// Define an abstract class named BaseCommand
export abstract class BaseCommand {
  // Define properties of the class
  public slashCommand:
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | SlashCommandSubcommandsOnlyBuilder;
  public category: KafuuCommandCategory;
  public permissions: KafuuCommandPermission[];
  public requirements: number;
  public botPermissions: Discord.PermissionsString[];
  protected client: KafuuClient;

  // Define the constructor method
  public constructor(
    slashCommand:
      | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
      | SlashCommandSubcommandsOnlyBuilder,
    client: KafuuClient,
    category: KafuuCommandCategory,
    permissions: KafuuCommandPermission[],
    requirements: number,
    botPermissions: Discord.PermissionsString[]
  ) {
    // Assign values to the properties
    this.slashCommand = slashCommand;
    this.client = client;
    this.category = category;
    this.permissions = permissions;
    this.botPermissions = botPermissions;
    this.requirements = requirements;
  }

  // Define an asynchronous method named onCommandInteraction
  public async onCommandInteraction(
    context: KafuuCommandContext<boolean>
  ): Promise<void> {
    // Throw an error if the method is not implemented
    throw new Error("Method not implemented. BaseCommand#onCommandInteraction");
  }

  // Define an asynchronous method named onAutocompleteInteraction
  public async onAutocompleteInteraction(
    interaction: Discord.AutocompleteInteraction
  ): Promise<void> {
    // Throw an error if the method is not implemented
    throw new Error(
      "Method not implemented. BaseCommand#onAutocompleteInteraction"
    );
  }

  // Define an asynchronous method named onButtonInteraction
  public async onButtonInteraction(
    interaction: Discord.ButtonInteraction
  ): Promise<void> {
    // Throw an error if the method is not implemented
    throw new Error("Method not implemented. BaseCommand#runButton");
  }

  // Define an asynchronous method named onMessageComponentInteraction
  public async onMessageComponentInteraction(
    interaction: Discord.MessageComponentInteraction
  ): Promise<void> {
    // Throw an error if the method is not implemented
    throw new Error("Method not implemented. BaseCommand#runMessageComponent");
  }

  // Define an asynchronous method named onSelectMenuInteraction
  public async onSelectMenuInteraction(
    interaction: Discord.SelectMenuInteraction
  ): Promise<void> {
    // Throw an error if the method is not implemented
    throw new Error("Method not implemented. BaseCommand#runSelectMenu");
  }

  // Define an asynchronous method named onContextMenuCommand
  public async onContextMenuCommand(
    interaction: Discord.ContextMenuCommandInteraction
  ): Promise<void> {
    // Throw an error if the method is not implemented
    throw new Error("Method not implemented. BaseCommand#runContextMenu");
  }

  // Define an asynchronous method named onUserContextCommand
  public async onUserContextCommand(
    interaction: Discord.UserContextMenuCommandInteraction
  ): Promise<void> {
    // Throw an error if the method is not implemented
    throw new Error("Method not implemented. BaseCommand#runUserContextMenu");
  }

  // Define a method named getCustomId
  public getCustomId(customId: string): string {
    // Return a string with the name of the slash command and the custom ID
    return `[${this.slashCommand.name};${customId};`;
  }
}
