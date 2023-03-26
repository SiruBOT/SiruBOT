import { SlashCommandBuilder } from "discord.js";
import { BaseCommand, Client } from "../../../structures";
import { CommandCategories } from "../../../types";
import { CommandPermissions } from "../../../types/CommandTypes/CommandPermissions";
import { CommandRequirements } from "../../../types/CommandTypes/CommandRequirements";

class SettingsCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("settings")
      .setNameLocalizations({
        ko: "설정",
      })
      .setDescription("Change/View bot's settings.")
      .setDescriptionLocalizations({
        ko: "봇의 설정을 변경하거나 보여드려요!",
      });
    super(
      slashCommand,
      client,
      CommandCategories.ADMIN,
      [CommandPermissions.ADMIN],
      CommandRequirements.NOTHING,
      ["SendMessages"]
    );
  }
}

export default SettingsCommand;
