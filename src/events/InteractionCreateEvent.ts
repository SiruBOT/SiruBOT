import * as Discord from "discord.js";
import * as Sentry from "@sentry/node";
import type { Transaction } from "@sentry/types";
import { type BaseCommand, BaseEvent, type Client } from "../structures";
import locale from "../locales";
import { Constants, Node } from "shoukaku";
import { ICommandRequirements } from "../types";
import { Logger } from "tslog";
import { Guild } from "../database/mysql/entities";
import { CommandPermissionChecker } from "../structures/CommandPermissionChecker";
import { CommandPermissionError } from "../structures/errors/CommandPermissionError";
import { InteractionType } from "discord.js";

const SYSTEM_MESSAGE_EPHEMERAL = false;
const COMMAND_WARN_MESSAGE_EPHEMERAL = true;

export default class InteractionCreateEvent extends BaseEvent {
  private log: Logger;
  constructor(client: Client) {
    super(client, "interactionCreate");
    this.log = client.log.getChildLogger({
      name: client.log.settings.name + "/InteractionHandler",
    });
  }

  async run(interaction: Discord.Interaction): Promise<void> {
    const transaction: Transaction = Sentry.startTransaction({
      op: "interactionCreate",
      name: "Interaction handler",
    });
    transaction.setData("interactionType", interaction.type);
    transaction.setData("interactionLocale", interaction.locale);
    this.log.debug(
      `Interaction received. ${interaction.id}/${interaction.type}`
    );
    await this.routeInteraciton(interaction, transaction);
  }

  // Routes interaction to the correct handler
  async routeInteraciton(
    interaction: Discord.Interaction,
    transaction?: Transaction
  ) {
    if (interaction.isChatInputCommand()) {
      transaction?.setData("interactionType", "ChatInputCommandInteraction");
      await this.handleChatInputCommandInteraction(interaction, transaction);
      return;
    }
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      transaction?.setData("interactionType", "ApplicationCommandAutocomplete");
      await this.handleAutoComplete(interaction, transaction);
    }
  }

  private generateCommandInfoString(
    interaction: Discord.CommandInteraction
  ): string {
    return `commandName: ${interaction.commandName}, interactionId: ${interaction.id}`;
  }

  // Handle command interaction type
  private async handleChatInputCommandInteraction(
    interaction: Discord.ChatInputCommandInteraction,
    transaction?: Transaction
  ): Promise<void> {
    this.log.info(
      `Handle command (${this.generateCommandInfoString(interaction)})`
    );
    transaction?.setData("commandName", interaction.commandName);
    const command: BaseCommand | undefined = this.client.commands.get(
      interaction.commandName
    );
    if (!command) {
      this.log.warn(
        `Command not found (${this.generateCommandInfoString(interaction)})`
      );
      transaction?.setHttpStatus(404);
      transaction?.finish();
      await interaction.reply({
        ephemeral: true,
        content: locale.format(interaction.locale, "UNKNOWN_COMMAND"),
      });
    } else {
      transaction?.setData("guildId", interaction.guildId);
      // -------- Handle guild command interaction --------
      if (!interaction.inCachedGuild() && interaction.guildId) {
        this.log.debug(
          `Guild ${interaction.guildId} not cached. fetch Guild..`
        );
        try {
          await this.client.guilds.fetch(interaction.guildId);
        } catch (error) {
          const exceptionId: string = Sentry.captureException(error);
          await interaction.reply({
            content: locale.format(
              interaction.locale,
              "GUILD_CACHE_FAILED",
              exceptionId
            ),
          });
          transaction?.setData("error", "Guild_Cache_Failed");
          transaction?.finish();
          return;
        }
      } else {
        transaction?.setData("isCached", "Already_Cached");
      }
      // Start
      if (interaction.inCachedGuild()) {
        if (!interaction.guild.members.me) throw new Error("TODO: Handle this");
        // Start of Handle Command
        try {
          // -------- Handle bot's permissions --------
          const missingPermissions: Discord.PermissionsString[] = [];
          for (const guildPermission of command.botPermissions) {
            if (
              !interaction.guild.members.me.permissions.has(guildPermission)
            ) {
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
            this.log.warn(
              `Missing permissions @ ${command.slashCommand.name} (${permissionString})`
            );
            await interaction.reply({
              ephemeral: SYSTEM_MESSAGE_EPHEMERAL,
              content: locale.format(
                interaction.locale,
                "MISSING_BOT_PERMISSIONS",
                permissionString
              ), // end of format
            });
            transaction?.setData("missingPermissions", permissionString);
            transaction?.setHttpStatus(401);
            transaction?.finish();
            return;
          }

          // Handle guild default value
          const guildConfig: Guild =
            await this.client.databaseHelper.upsertAndFindGuild(
              interaction.guildId
            );
          const member: Discord.GuildMember | undefined =
            interaction.guild?.members.cache.get(interaction.member.user.id) ??
            (await interaction.guild?.members.fetch(interaction.user.id));

          if (!member)
            throw new Error(
              "Fetch member, but member not found. " + interaction.user.id
            );
          const userPermissions = CommandPermissionChecker.getPermissions({
            guildConfig,
            guildMember: member,
            settings: this.client.settings,
          });
          // Command.permissions 중 userPermissions 에 한개라도 있으면 권한 있음, 없으면 권한 없음
          if (
            command.permissions.filter((e) => userPermissions.includes(e))
              .length === 0
          ) {
            transaction?.setData("endReason", "CommandPermissionNotFound");
            transaction?.setHttpStatus(403);
            transaction?.finish();
            await interaction.reply({
              ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
              content: locale.format(
                interaction.locale,
                "MISSING_USER_PERMISSIONS",
                command.permissions.map((e) => `**${e}**`).join(", ")
              ),
            });
            return;
          }
          if (guildConfig.textChannelId) {
            const defaultTextChannel: Discord.Channel | undefined | null =
              this.client.channels.cache // 채널 캐시에 없다면 fetch, AnyChannel = TextChannel : AnyChannel, channels.fetch => AnyChannel
                .filter((ch) => ch.isTextBased())
                .get(guildConfig.textChannelId) ??
              (await this.client.channels.fetch(guildConfig.textChannelId));
            if (
              defaultTextChannel?.isTextBased() &&
              interaction.channelId != defaultTextChannel.id
            ) {
              await interaction.reply({
                ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
                content: locale.format(
                  interaction.locale,
                  "DEFAULT_TEXT_CHANNEL",
                  defaultTextChannel.id
                ),
              });
              transaction?.setData("endReason", "NotDefaultTextChannel");
              transaction?.setHttpStatus(500);
              transaction?.finish();
              return;
            }
          }

          /** Handle commandRequirements */
          const { requirements }: { requirements: ICommandRequirements } =
            command;
          // -------- Handle audioNodes  --------
          if (requirements.audioNode) {
            const connectedNodes: Node[] = [
              ...this.client.audio.nodes.values(),
            ].filter((e: Node) => {
              return e.state == Constants.State.CONNECTED;
            });
            if (connectedNodes.length === 0) {
              await interaction.reply({
                ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
                content: locale.format(
                  interaction.locale,
                  "NO_NODES_AVAILABLE"
                ),
              });
              transaction?.setData("endReason", "NoNodesAvailable");
              transaction?.setHttpStatus(500);
              transaction?.finish();
              return;
            }
          }

          // -------- Handle trackPlaying --------
          if (requirements.trackPlaying) {
            if (!this.client.audio.hasPlayerDispatcher(interaction.guildId)) {
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
            // VoiceConnected
            // const defaultVoiceChannel: Discord.AnyChannel | undefined | null =
            //   this.client.channels.cache // 채널 캐시에 없다면 fetch
            //     .filter((ch) => ch.type === "GUILD_VOICE")
            //     .get(guildConfig.voiceChannelId) ??
            //   (await this.client.channels.fetch(guildConfig.voiceChannelId));
            if (
              requirements.voiceStatus.voiceConnected &&
              !member.voice.channelId
            ) {
              await interaction.reply({
                ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
                content: locale.format(interaction.locale, "JOIN_VOICE_FIRST"),
              });
              transaction?.setData("endReason", "JoinFirst");
              transaction?.setHttpStatus(403);
              transaction?.finish();
              return;
            }
            // Listen First
            if (
              requirements.voiceStatus.listenStatus &&
              member.voice.selfDeaf
            ) {
              await interaction.reply({
                ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
                content: locale.format(interaction.locale, "LISTEN_FIRST"),
              });
              transaction?.setData("endReason", "ListenFirst");
              transaction?.setHttpStatus(403);
              transaction?.finish();
              return;
            }
            // Samechannel
            if (requirements.voiceStatus.sameChannel) {
              if (
                interaction.guild?.members.me?.voice.channelId &&
                member.voice.channelId !=
                  interaction.guild?.members.me?.voice.channelId
              ) {
                await interaction.reply({
                  ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
                  content: locale.format(
                    interaction.locale,
                    "SAME_CHANNEL",
                    interaction.guild.members.me.voice.channelId
                  ),
                });
                transaction?.setData("endReason", "SameChannel");
                transaction?.setHttpStatus(403);
                transaction?.finish();
                return;
              }
            }
          }
          // Run command
          await command.onCommandInteraction({
            interaction,
            userPermissions,
          });
          this.log.debug(
            `Command successfully executed (${this.generateCommandInfoString(
              interaction
            )})`
          );
          transaction?.setData("endReason", "ok");
          transaction?.setHttpStatus(200);
          transaction?.finish();
          return;
        } catch (error) {
          // Command Permission error handle
          if (error instanceof CommandPermissionError) {
            await interaction.reply({
              ephemeral: SYSTEM_MESSAGE_EPHEMERAL,
              content: locale.format(
                interaction.locale,
                "COMMAND_PERMISSION_ERROR",
                error.permission
              ),
            });
            return;
          } else {
            this.log.error(
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
              this.log.warn(
                `Failed to reply error message ${exceptionId}`,
                error
              );
            }
            transaction?.setData("endReason", "error");
            transaction?.setData("errorId", exceptionId);
            transaction?.setHttpStatus(500);
            transaction?.finish();
            return;
          }
        }
      } // End of inGuild
    }
  }

  // Handle command interaction type
  private async handleAutoComplete(
    interaction: Discord.AutocompleteInteraction,
    transaction?: Transaction
  ): Promise<void> {
    transaction?.setData("commandName", interaction.commandName);
    const command: BaseCommand | undefined = this.client.commands.get(
      interaction.commandName
    );
    if (!command) {
      transaction?.setHttpStatus(404);
      transaction?.finish();
      await interaction.respond([
        { name: "Error", value: "AutoComplete command not found." },
      ]);
      return;
    } else {
      try {
        await command.onAutocompleteInteraction(interaction);
      } catch (error) {
        Sentry.captureException(error);
        this.log.error(
          `Failed to handle autocomplete command ${interaction.commandName}`,
          error
        );
      }
      return;
    }
  }
}
