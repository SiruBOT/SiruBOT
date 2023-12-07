import type {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  PermissionsString,
  AutocompleteInteraction,
  MessageComponentInteraction,
  SelectMenuInteraction,
  ContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";
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
type AnySlashCommandBuilder =
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
  | SlashCommandSubcommandsOnlyBuilder;
export abstract class BaseCommand {
  // Define properties of the class
  public slashCommand: AnySlashCommandBuilder;
  public category: KafuuCommandCategory;
  public permissions: KafuuCommandPermission[];
  public requirements: number;
  public botPermissions: PermissionsString[];
  protected client: KafuuClient;

  // Define the constructor method
  public constructor(
    slashCommand: AnySlashCommandBuilder,
    client: KafuuClient,
    category: KafuuCommandCategory,
    permissions: KafuuCommandPermission[],
    requirements: number,
    botPermissions: PermissionsString[]
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
    interaction: AutocompleteInteraction
  ): Promise<void>;

  public onButtonInteraction?(context: KafuuButtonContext): Promise<void>;

  public onMessageComponentInteraction?(
    interaction: MessageComponentInteraction
  ): Promise<void>;

  public onSelectMenuInteraction?(
    interaction: SelectMenuInteraction
  ): Promise<void>;

  public onContextMenuCommand?(
    interaction: ContextMenuCommandInteraction
  ): Promise<void>;

  public onUserContextCommand?(
    interaction: UserContextMenuCommandInteraction
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
