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
  KafuuButtonContext,
  KafuuRoleSelectMenuContext,
  KafuuMessageComponentCustomIdOptions,
  KafuuChannelSelectMenuContext,
} from "@/types/command";
import { KafuuCommandPermission } from "@/types/command";
import { getCustomId } from "@/utils/formatter";

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

  public abstract onCommandInteraction(
    context: KafuuCommandContext<boolean>
  ): Promise<void>;

  public onChannelSelectMenuInteraction?(
    context: KafuuChannelSelectMenuContext
  ): Promise<void>;

  public onRoleSelectMenuInteraction?(
    context: KafuuRoleSelectMenuContext
  ): Promise<void>;

  public onAutocompleteInteraction?(
    interaction: Discord.AutocompleteInteraction
  ): Promise<void>;

  public onButtonInteraction?(context: KafuuButtonContext): Promise<void>;

  public onMessageComponentInteraction?(
    interaction: Discord.MessageComponentInteraction
  ): Promise<void>;

  public onSelectMenuInteraction?(
    interaction: Discord.SelectMenuInteraction
  ): Promise<void>;

  public onContextMenuCommand?(
    interaction: Discord.ContextMenuCommandInteraction
  ): Promise<void>;

  public onUserContextCommand?(
    interaction: Discord.UserContextMenuCommandInteraction
  ): Promise<void>;

  // Message Component custom id template: [commandName]:[customId]:[executorId];[args];[args];[args]
  protected getCustomId(
    option: Omit<KafuuMessageComponentCustomIdOptions, "commandName">
  ): string {
    // Return a string with the name of the slash command and the custom ID
    return getCustomId({
      commandName: this.slashCommand.name,
      ...option,
    });
  }
}
