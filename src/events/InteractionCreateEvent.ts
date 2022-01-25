import * as Discord from "discord.js";
import * as Sentry from "@sentry/node";
import type { Transaction } from "@sentry/types";
import { type BaseCommand, BaseEvent, type Client } from "../structures";

export default class DebugEvent extends BaseEvent {
  constructor(client: Client) {
    super(client, "interactionCreate");
  }

  async run(interaction: Discord.Interaction): Promise<void> {
    const transaction: Transaction = Sentry.startTransaction({
      op: "interactionCreate",
      name: "Interaction transaction",
    });
    transaction.setData("interactionType", interaction.type);
    transaction.setData("interactionLocale", interaction.locale);
    await this.routeInteraciton(interaction, transaction);
  }

  // Routes interaction to the correct handler
  async routeInteraciton(
    interaction: Discord.Interaction,
    transaction?: Transaction
  ) {
    if (interaction.isCommand())
      await this.handleCommand(interaction, transaction);
  }

  // Handle command interaction type
  async handleCommand(
    interaction: Discord.CommandInteraction,
    transaction?: Transaction
  ) {
    transaction?.setData("commandName", interaction.commandName);
    const command: BaseCommand | undefined = this.client.commands.get(
      interaction.commandName
    );
    if (!command) {
      interaction.reply({
        ephemeral: true,
        content: "Unknown command.",
      });
    } else {
      await command.runCommand(interaction);
    }
  }
  // if (interaction.isAutocomplete())

  // // eslint-disable-next-line prettier/prettier
  // if (interaction.isButton())

  // if (interaction.isContextMenu())

  // if (interaction.isMessageComponent())

  // if (interaction.isSelectMenu())

  // if (interaction.isUserContextMenu())
}
