import * as Discord from "discord.js";
import * as Sentry from "@sentry/node";
import type { Transaction } from "@sentry/types";
import { type BaseCommand, BaseEvent, type Client } from "../structures";
import locale from "../locales";

export default class DebugEvent extends BaseEvent {
  constructor(client: Client) {
    super(client, "interactionCreate");
  }

  async run(interaction: Discord.Interaction): Promise<void> {
    const transaction: Transaction = Sentry.startTransaction({
      op: "interactionCreate",
      name: "Interaction handler",
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
      this.client.log.warn(
        `Command not found (${this.generateCommandInfoString(interaction)})`
      );
      transaction?.setHttpStatus(404);
      transaction?.finish();
      await interaction.reply({
        ephemeral: true,
        content: locale.format(interaction.locale, "UNKNOWN_COMMAND"),
      });
    } else {
      // Start of inGuild
      if (interaction.inGuild()) {
        transaction?.setData("issuedWhere", "inGuild");
        // Handle guild permissions
        const missingPermissions: Discord.PermissionString[] = [];
        for (const guildPermission of command.requirements.guildPermissions) {
          if (!interaction.guild?.me?.permissions.has(guildPermission)) {
            missingPermissions.push(guildPermission);
          }
        }
        if (missingPermissions.length > 0) {
          await interaction.reply({
            ephemeral: true,
            // eslint-disable-next-line prettier/prettier
            content: locale.format(
              interaction.locale,
              "COMMAND_MISSING_PERMISSIONS",
              missingPermissions
                .map((p) => {
                  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(); // ADMINISTRATOR -> Administrator
                })
                .map((p) => `\`\`${p}\`\``)
                .join(", ")
            ), // end of format
          });
          transaction?.setHttpStatus(401);
          transaction?.finish();
          return;
        }
        // Execute Command
        try {
          await command.runCommand(interaction);
          this.client.log.debug(
            `Command successfully executed (${this.generateCommandInfoString(
              interaction
            )})`
          );
          transaction?.setHttpStatus(200);
          transaction?.finish();
        } catch (error) {
          this.client.log.error(
            `Command failed to execute (${this.generateCommandInfoString(
              interaction
            )})`
          );
          this.client.log.error(error);
          const exceptionId: string = Sentry.captureException(error);
          interaction.reply({
            ephemeral: true,
            content: locale.format(
              interaction.locale,
              "COMMAND_HANDLE_ERROR",
              exceptionId,
              error as string
            ),
          });
          transaction?.setHttpStatus(500);
          transaction?.finish();
        }
      } // End of inGuild
    }
  }

  private generateCommandInfoString(
    interaction: Discord.CommandInteraction
  ): string {
    return `commandName: ${interaction.commandName}, interactionId: ${interaction.id}`;
  }
  // if (interaction.isAutocomplete())

  // // eslint-disable-next-line prettier/prettier
  // if (interaction.isButton())

  // if (interaction.isContextMenu())

  // if (interaction.isMessageComponent())

  // if (interaction.isSelectMenu())

  // if (interaction.isUserContextMenu())
}
