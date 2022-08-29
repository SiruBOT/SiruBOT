import type { SlashCommandBuilder } from "@discordjs/builders";
import type * as Discord from "discord.js";
import type { Client } from ".";
import type {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
  ICommandRequirements,
} from "../types";

export abstract class BaseCommand {
  public slashCommand: Omit<
    SlashCommandBuilder,
    "addSubcommand" | "addSubcommandGroup"
  >;
  public category: CommandCategories;
  public permissions: CommandPermissions[];
  public requirements: ICommandRequirements;
  public botPermissions: Discord.PermissionsString[];
  protected client: Client;

  public constructor(
    slashCommand: Omit<
      SlashCommandBuilder,
      "addSubcommand" | "addSubcommandGroup"
    >,
    client: Client,
    category: CommandCategories,
    permissions: CommandPermissions[],
    requirements: ICommandRequirements,
    botPermissions: Discord.PermissionsString[]
  ) {
    this.slashCommand = slashCommand;
    this.client = client;
    this.category = category;
    this.permissions = permissions;
    this.botPermissions = botPermissions;
    this.requirements = requirements;
  }

  public async onCommandInteraction(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ICommandContext
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#onCommandInteraction");
  }

  public async onAutocompleteInteraction(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.AutocompleteInteraction
  ): Promise<void> {
    throw new Error(
      "Method not implemented. BaseCommand#onAutocompleteInteraction"
    );
  }

  public async onButtonInteraction(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.ButtonInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runButton");
  }

  public async onMessageComponentInteraction(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.MessageComponentInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runMessageComponent");
  }

  public async onSelectMenuInteraction(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.SelectMenuInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runSelectMenu");
  }

  public async onContextMenuCommand(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.ContextMenuCommandInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runContextMenu");
  }
  public async onUserContextCommand(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.UserContextMenuCommandInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runUserContextMenu");
  }

  // Custom id for handling
  public getCustomId(customId: string): string {
    return `[${this.slashCommand.name};${customId};`;
  }
}
