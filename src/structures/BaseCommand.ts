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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(interaction: Discord.Interaction): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
