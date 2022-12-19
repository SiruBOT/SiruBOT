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

export const SYSTEM_MESSAGE_EPHEMERAL = false;
export const COMMAND_WARN_MESSAGE_EPHEMERAL = true;

const eventName = "interactionCreate" as const;
export default class InteractionCreateEvent extends BaseEvent<
  typeof eventName
> {
  private log: Logger;
  constructor(client: Client) {
    super(client, eventName);
    this.log = client.log.getChildLogger({
      name: client.log.settings.name + "/InteractionHandler",
    });
  }

  public override async run(interaction: Discord.Interaction): Promise<void> {
    const transaction: Transaction = Sentry.startTransaction({
      op: "InteractionCreateEvent#run",
      name: "InteractionCreateEvent",
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
    if (interaction.applicationId !== this.client.user?.id) {
      this.client.log.warn(
        `Interaction application id mismatch. ${interaction.applicationId} ${this.client.user?.id}`
      );
      return;
    }
    if (interaction.isChatInputCommand()) {
      transaction?.setData("interactionType", "ChatInputCommandInteraction");
      await this.handleChatInputCommandInteraction(interaction, transaction);
      return;
    }
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      transaction?.setData("interactionType", "ApplicationCommandAutocomplete");
      await this.handleAutoComplete(interaction, transaction);
      return;
    }
    if (interaction.isButton()) {
      transaction?.setData("interactionType", "ButtonInteraction");
      await this.handleButton(interaction, transaction);
      return;
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
    // If command not exists
    if (!command) {
      this.log.warn(
        `Command not found (${this.generateCommandInfoString(interaction)})`
      );
      transaction?.setHttpStatus(404);
      transaction?.finish();
      // Then, Reply UNKNOWN_COMMAND
      await interaction.reply({
        ephemeral: true,
        content: locale.format(interaction.locale, "UNKNOWN_COMMAND"),
      });
    } else {
      // Starts handle command
      transaction?.setData("guildId", interaction.guildId);
      if (!interaction.inCachedGuild() && interaction.guildId) {
        this.log.debug(
          `Guild ${interaction.guildId} not cached. fetch Guild..`
        );
        try {
          await this.client.guilds.fetch(interaction.guildId);
        } catch (error) {
          // If fetch guild failed.
          const exceptionId: string = Sentry.captureException(error);
          await interaction.reply({
            content: locale.format(
              interaction.locale,
              "GUILD_CACHE_FAILED",
              exceptionId
            ),
          });
          transaction?.setData("error", "guild_cache_failed");
          transaction?.finish();
          // Ends method
          return;
        }
      } else {
        transaction?.setData("isCached", "already_cached");
      }
      // Start
      if (interaction.inCachedGuild()) {
        if (!interaction.guild.members.me) {
          await interaction.reply(
            locale.format(interaction.locale, "BOT_INVITE_FIRST")
          );
          return;
        }
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
          // Handle mimssing permissions
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
            // Ends method
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
          // Get user's permissions
          const userPermissions = CommandPermissionChecker.getPermissions({
            guildConfig,
            guildMember: member,
            settings: this.client.settings,
          });
          // userPermissions에 command.permissions가 포함되어있는게 없다면 종료
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
                  "AVAILABLE_ONLY_PLAYING"
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
            // TODO: Guild Default Channel
            // VoiceConnected
            if (
              requirements.voiceStatus.voiceConnected &&
              guildConfig.voiceChannelId
            ) {
              const guildVoiceChannel = await interaction.guild.channels.fetch(
                guildConfig.voiceChannelId
              );
              if (
                guildVoiceChannel &&
                interaction.member.voice.channelId != guildVoiceChannel.id
              ) {
                await interaction.reply(
                  locale.format(
                    interaction.locale,
                    "GUILD_DEFAULT_VCHANNEL",
                    guildVoiceChannel.id
                  )
                );
                return;
              }
            }
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
              if (interaction.deferred) await interaction.editReply(payload);
              else if (interaction.replied) await interaction.followUp(payload);
              else await interaction.reply(payload);
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
        if (!interaction.responded) await interaction.respond([]);
        Sentry.captureException(error);
        this.log.error(
          `Failed to handle autocomplete command ${interaction.commandName}`,
          error
        );
      }
      return;
    }
  }

  private async handleButton(
    interaction: Discord.ButtonInteraction,
    transaction?: Transaction
  ) {
    const customIdCheckRegex = /^[[a-z]+;\w+;$/g;
    const commandNameRegex = /(?<=\[)(.*?)(?=;)/g;
    const customIdRegex = /(?<=;)(.*?)(?=;)/g;
    const commandName = interaction.customId.match(commandNameRegex)?.at(0);
    const customId = interaction.customId.match(customIdRegex)?.at(0);
    if (!customIdCheckRegex.test(interaction.customId)) {
      transaction?.setHttpStatus(500);
      transaction?.setData("error", "custom_id_regex_failed");
      transaction?.setData("custom_id", interaction.customId);
      transaction?.finish();
      this.client.log.warn(
        "Failed to handle button interaction, custom id pattern check failed."
      );
      return;
    }
    this.client.log.debug(`handleButton: ${commandName}/${customId}`);
    // When command parse failed
    if (!commandName) {
      transaction?.setHttpStatus(500);
      transaction?.setData("error", "command_name_not_found");
      transaction?.finish();
      this.client.log.warn(
        "Failed to handle button interaction, command name not found."
      );
      return;
    }
    // When custom id parse failed
    if (!customId) {
      transaction?.setHttpStatus(500);
      transaction?.setData("error", "custom_id_not_found");
      transaction?.finish();
      this.client.log.warn(
        "Failed to handle button interaction, bot coudn't parse custom id."
      );
      return;
    }
    const command = this.client.commands.get(commandName);
    // When command not found.
    if (!command) {
      transaction?.setHttpStatus(500);
      transaction?.setData("error", "command_not_found");
      transaction?.finish();
      this.client.log.warn(
        "Failed to handle button interaction, command name not found."
      );
      return;
    }
    // End Error handle
    interaction.customId = customId;
    try {
      await command?.onButtonInteraction(interaction);
    } catch (error) {
      Sentry.captureException(error);
      this.client.log.error(error);
    }
  }
}
