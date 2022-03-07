import * as Discord from "discord.js";
import * as Sentry from "@sentry/node";
import type { Transaction } from "@sentry/types";
import { type BaseCommand, BaseEvent, type Client } from "../structures";
import locale from "../locales";
import { Constants, ShoukakuSocket } from "shoukaku";
import { ICommandRequirements } from "../types";
// import { Guild } from "../database/mysql/entities";
import { PlayerDispatcher } from "../structures/audio/PlayerDispatcher";

const SYSTEM_MESSAGE_EPHEMERAL = false;
const COMMAND_WARN_MESSAGE_EPHEMERAL = true;

export default class InteractionCreateEvent extends BaseEvent {
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
    this.client.log.debug(
      `Interaction received. ${interaction.id}/${interaction.type}`
    );
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
      // -------- Handle guild command interaction --------
      if (interaction.inGuild()) {
        transaction?.setData("guildId", interaction.guildId);
        // If guild is not cached. fetch guild
        if (!interaction.inCachedGuild()) {
          this.client.log.debug(
            `Guild ${interaction.guildId} not cached. fetch Guild..`
          );
          transaction?.setData("isCached", "notCachedGuild");
          try {
            await this.client.guilds.fetch(interaction.guildId);
          } catch (error) {
            const exceptionId: string = Sentry.captureException(error);
            await interaction.reply({
              content: locale.format(
                interaction.locale,
                "GUILD_CACHE_FAILED",
                exceptionId,
                error as string
              ),
            });
            transaction?.setData("error", "Guild_Cache_Failed");
            transaction?.finish();
            return;
          }
        } else {
          transaction?.setData("isCached", "inCachedGuild");
        }
        // eslint-disable-next-line prettier/prettier
        const { requirements }: { requirements: ICommandRequirements } = command;
        // -------- Handle guild permissions --------
        const missingPermissions: Discord.PermissionString[] = [];
        for (const guildPermission of requirements.guildPermissions) {
          if (!interaction.guild?.me?.permissions.has(guildPermission)) {
            missingPermissions.push(guildPermission);
          }
        }
        if (missingPermissions.length > 0) {
          const permissionString: string = missingPermissions
            .map((p) => {
              return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(); // ADMINISTRATOR -> Administrator
            })
            .map((p) => `\`\`${p}\`\``)
            .join(", ");
          this.client.log.warn(
            `Missing permissions @ ${command.slashCommand.name} (${permissionString})`
          );
          await interaction.reply({
            ephemeral: SYSTEM_MESSAGE_EPHEMERAL,
            content: locale.format(
              interaction.locale,
              "COMMAND_MISSING_PERMISSIONS",
              permissionString
            ), // end of format
          });
          transaction?.setData("missingPermissions", permissionString);
          transaction?.setHttpStatus(401);
          transaction?.finish();
          return;
        }

        // -------- Handle audioNodes  --------
        if (requirements.audioNode) {
          const connectedNodes: ShoukakuSocket[] = [
            ...this.client.audio.nodes.values(),
          ].filter((e: ShoukakuSocket) => {
            return e.state == Constants.state.CONNECTED;
          });
          if (connectedNodes.length === 0) {
            await interaction.reply({
              ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
              content: locale.format(interaction.locale, "NO_NODES_AVAILABLE"),
            });
            transaction?.setData("endReason", "NoNodesAvailable");
            transaction?.setHttpStatus(500);
            transaction?.finish();
            return;
          }
        }

        // -------- Handle trackPlaying --------
        if (requirements.trackPlaying) {
          const dispatcher: PlayerDispatcher | undefined =
            this.client.audio.dispatchers.get(interaction.guildId);
          if (!dispatcher) {
            await interaction.reply({
              ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
              content: locale.format(
                interaction.locale,
                "AVALIABLE_ONLY_PLAYING"
              ),
            });
            transaction?.setData("endReason", "TrackNotPlaying");
            transaction?.setHttpStatus(500);
            transaction?.finish();
            return;
          }
        }

        // -------- Handle user voiceStatus --------
        if (requirements.voiceStatus) {
          const member: Discord.GuildMember | undefined =
            await interaction.guild?.members.fetch(interaction.user.id);
          if (!member)
            throw new Error(
              "Fetch member. but member not found. " + interaction.user.id
            );
          if (
            requirements.voiceStatus.voiceConnected &&
            !member.voice.channelId
          ) {
            await interaction.reply({
              ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
              content: locale.format(interaction.locale, "JOIN_VOICE_FIRST"),
            });
            transaction?.setData("endReason", "JoinFirst");
            transaction?.setHttpStatus(500);
            transaction?.finish();
            return;
          }
          if (requirements.voiceStatus.listenStatus && member.voice.selfDeaf) {
            await interaction.reply({
              ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
              content: locale.format(interaction.locale, "LISTEN_FIRST"),
            });
            transaction?.setData("endReason", "ListenFirst");
            transaction?.setHttpStatus(500);
            transaction?.finish();
            return;
          }
          // If default voice channel sets. skip it!
          // const guildConfig: Guild =
          //   await this.client.databaseHelper.upsertAndFindGuild(
          //     interaction.guildId
          //   );
          //TODO: implement samechannel

          // if (
          //   requirements.voiceStatus.sameChannel && // SameChannel = true
          //   guildConfig.voiceChannelId
          //   !(await interaction.guild?.channels.fetch(
          //     guildConfig.voiceChannelId
          //   )) &&
          //   interaction.guild?.me && // If guild.me (client) exists
          //   interaction.guild?.me?.voice.channelId && // and me (client) is joined a channel
          //   member.voice.channelId !== interaction.guild?.me?.voice.channelId // and not same channel
          // ) {
          // }
        }

        // Execute Command
        try {
          await command.runCommand(interaction);
          this.client.log.debug(
            `Command successfully executed (${this.generateCommandInfoString(
              interaction
            )})`
          );
          transaction?.setData("endReason", "ok");
          transaction?.setHttpStatus(200);
          transaction?.finish();
        } catch (error) {
          this.client.log.error(
            `Command failed to execute (${this.generateCommandInfoString(
              interaction
            )})`,
            error
          );
          const exceptionId: string = Sentry.captureException(error);
          const payload: Discord.InteractionReplyOptions = {
            ephemeral: SYSTEM_MESSAGE_EPHEMERAL,
            content: locale.format(
              interaction.locale,
              "COMMAND_HANDLE_ERROR",
              exceptionId,
              error as string
            ),
          };
          try {
            await interaction.reply(payload);
          } catch (error) {
            await interaction.channel?.send(payload);
          } finally {
            this.client.log.warn(
              `Failed to reply error message ${exceptionId} ${error}`
            );
          }
          transaction?.setData("endReason", "error");
          transaction?.setData("errorId", exceptionId);
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
