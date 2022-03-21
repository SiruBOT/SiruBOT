import type { SlashCommandBuilder } from "@discordjs/builders";
import type * as Discord from "discord.js";
import type { Client } from ".";
import type {
  CommandCategories,
  CommandPermissions,
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
  public botPermissions: Discord.PermissionString[];
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
    botPermissions: Discord.PermissionString[]
  ) {
    this.slashCommand = slashCommand;
    this.client = client;
    this.category = category;
    this.permissions = permissions;
    this.botPermissions = botPermissions;
    this.requirements = requirements;
  }

  async runCommand(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.CommandInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runCommand");
  }

  async runAutocomplete(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.AutocompleteInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runAutocomplete");
  }

  async runButton(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.ButtonInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runButton");
  }

  async runContextMenu(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.ContextMenuInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runContextMenu");
  }

  async runMessageComponent(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.MessageComponentInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runMessageComponent");
  }

  async runSelectMenu(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.SelectMenuInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runSelectMenu");
  }

  async runUserContextMenu(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interaction: Discord.UserContextMenuInteraction
  ): Promise<void> {
    throw new Error("Method not implemented. BaseCommand#runUserContextMenu");
  }
}
