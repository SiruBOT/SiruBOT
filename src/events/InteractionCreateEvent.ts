// Logger, Shoukaku Constants
import { Logger } from "tslog";
import { Constants } from "shoukaku";

// import discord.js
import * as Discord from "discord.js";
// Import Sentry.io stuff
import * as Sentry from "@sentry/node";
import type { Transaction } from "@sentry/types";
import { Span } from "@sentry/tracing";

// Import structures
import { type BaseCommand, BaseEvent, type KafuuClient } from "@/structures";
// Import database models
import { TypeORMGuild } from "@/models/typeorm";
// Import  command flags, permission checker
import { getUserPermissions } from "@/utils/permission";
import {
  KafuuCommandFlags,
  KafuuMessageComponentCustomIdOptions,
} from "@/types/command";
// Import bot constants
import {
  COMMAND_WARN_MESSAGE_EPHEMERAL,
  SYSTEM_MESSAGE_EPHEMERAL,
} from "@/constants/events/InteractionCreateEvent";
// Import locales
import { STRING_KEYS } from "@/types/locales";
import { format } from "@/locales";

export default class InteractionCreateEvent extends BaseEvent<"interactionCreate"> {
  private log: Logger;
  constructor(client: KafuuClient) {
    super(client, "interactionCreate");
    this.log = client.log.getChildLogger({
      name: client.log.settings.name + "-" + InteractionCreateEvent.name,
    });
  }

  public override async run(interaction: Discord.Interaction): Promise<void> {
    this.log.debug(
      `Interaction received. ${interaction.id}/${interaction.type}`,
    );

    // Sentry
    const transaction: Transaction = Sentry.startTransaction({
      op: "InteractionCreateEvent#run",
      name: "InteractionCreateEvent",
    });
    transaction.setData("guildId", interaction.guildId);
    transaction.setData("userId", interaction.user.id);
    transaction.setData("shardId", interaction.guild?.shardId);
    transaction.setData("clusterId", this.client.cluster?.id ?? 0);
    transaction.setData("interactionType", interaction.type);
    transaction.setData("interactionLocale", interaction.locale);

    await this.routeInteraciton(interaction, transaction);
  }

  // Routes interaction to the correct handler
  async routeInteraciton(
    interaction: Discord.Interaction,
    transaction: Transaction,
  ) {
    // Sentry
    const span: Span = transaction.startChild({
      op: "InteractionCreateEvent#routeInteraction",
      description: "Route interaction to the correct handler",
    });

    if (interaction.applicationId !== this.client.user?.id) {
      // 클라이언트 아이디와 인터렉션의 클라이언트 아이디가 다르면
      this.client.log.warn(
        `Interaction application id mismatch. ${interaction.applicationId} ${this.client.user?.id}`,
      );
      span.setHttpStatus(500);
      span.setData("endReason", "interactionApplicationIdMismatch");
      span.finish();
      transaction.finish();
      return;
    }

    // 인터렉션 타입에 따라서 핸들러를 다르게 호출
    if (interaction.isChatInputCommand())
      await this.handleChatInputCommandInteraction(interaction, transaction);
    if (interaction.isAutocomplete())
      await this.handleAutoComplete(interaction, transaction);
    if (interaction.isMessageComponent())
      await this.handleMessageComponent(interaction, transaction);
  }

  private cmdInfoStr(interaction: Discord.CommandInteraction): string {
    return `commandName: ${interaction.commandName}, interactionId: ${interaction.id}`;
  }

  // Handle command interaction type
  private async handleChatInputCommandInteraction(
    interaction: Discord.ChatInputCommandInteraction,
    transaction: Transaction,
  ): Promise<void> {
    this.log.info(`Handle command (${this.cmdInfoStr(interaction)})`);

    const span: Span = transaction.startChild({
      op: "InteractionCreateEvent#handleChatInputCommandInteraction",
      description: "Handle ChatInputCommand type",
    });

    const command: BaseCommand | undefined = this.client.commands.get(
      interaction.commandName,
    );

    span.setData("commandName", interaction.commandName);

    try {
      //#region Basic checks
      // 명령어가 없다면
      if (!command) {
        this.log.warn(`Command not found (${this.cmdInfoStr(interaction)})`);
        // Sentry capture
        Sentry.captureEvent({
          message: `Command not found (${this.cmdInfoStr(interaction)})`,
        });
        span.setHttpStatus(404);
        span.setData("endReason", "commandNotFound");
        span.finish();
        transaction.finish();

        // 알수 없는 명령어에요.
        await interaction.reply({
          ephemeral: true,
          content: format(interaction.locale, "UNKNOWN_COMMAND"),
        });
        return;
      }

      // 명령어가 길드에서 실행된게 아니라면
      if (!interaction.inGuild()) {
        span.setHttpStatus(500);
        span.setData("endReason", "notInGuild");
        span.finish();
        transaction.finish();
        await interaction.reply({
          content: format(interaction.locale, "NOT_IN_GUILD"),
        });
        return;
      }

      // 길드가 캐시된 길드가 아닐 경우, 캐싱 시도
      if (!interaction.inCachedGuild()) {
        this.log.debug(
          `Guild ${interaction.guildId} not cached. fetch Guild..`,
        );
        try {
          // 길드 가져오기 시도
          this.client.guilds.cache.set(
            interaction.guildId,
            await this.client.guilds.fetch(interaction.guildId),
          );
        } catch (error) {
          // 길드 가져오기에 실패했다면
          const excepId = Sentry.captureException(error);
          await interaction.reply({
            content: format(interaction.locale, "GUILD_CACHE_FAILED"),
          });
          span.setHttpStatus(500);
          span.setData("endReason", "guildCacheFailed");
          span.setData("isCached", "guildCacheFailed");
          span.setData("exceptionId", excepId);
          transaction.finish();
          return;
        }
      }

      if (!interaction.inCachedGuild()) return; // 위에서 캐시 시도했는데도 캐시 안되면 무시
      // 캐시되있다면 alreadyCached 로 표시
      span.setData("isCached", "alreadyCached");

      // 명령어는 작동하는데, 길드에 봇이 없다면, ApplicationCommand scope만 사용해서 초대한것이기 떄문에 초대 메세지 발송
      if (!interaction.guild.members.me) {
        span.setHttpStatus(500);
        span.setData("endReason", "applicatonCommandOnly");
        transaction.finish();
        await interaction.reply(format(interaction.locale, "BOT_INVITE_FIRST"));
        return;
      }
      //#endregion

      //#region Check bot permissons in guild
      // 봇에 없는 권한 찾기
      const missingPermissions = command.botPermissions.filter(
        (perm) => !interaction.guild.members.me?.permissions.has(perm),
      );
      // 봇에 권한이 없다면
      if (missingPermissions.length > 0) {
        this.log.warn(
          `Missing permissions ${
            command.slashCommand.name
          } (${missingPermissions.join(",")}) @ ${interaction.guildId}`,
        );
        const permStr = missingPermissions
          .map(
            // 현지화된 이름으로 권한 이름을 바꿔줌
            (e) =>
              "``" +
              format(interaction.locale, ("PERM_" + e) as STRING_KEYS) +
              "``",
          )
          .join(", ");
        await interaction.reply({
          ephemeral: SYSTEM_MESSAGE_EPHEMERAL,
          content: format(
            interaction.locale,
            "MISSING_BOT_PERMISSIONS",
            permStr,
          ), // end of format
        });
        span.setData("endReason", "missingBotPermissions");
        span.setData("missingPermissions", missingPermissions);
        span.setHttpStatus(401);
        span.finish();
        transaction.finish();
        // Ends method
        return;
      }
      //#endregion

      //#region  Check member, guild config
      const guildConfig: TypeORMGuild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
        );

      const member: Discord.GuildMember | undefined =
        interaction.guild?.members.cache.get(interaction.member.user.id) ??
        (await interaction.guild?.members.fetch(interaction.user.id));

      if (!member)
        throw new Error(
          "Fetch member, but member not found. " + interaction.user.id,
        );
      //#endregion

      //#region  Check user permission
      const userPermissions = await getUserPermissions({
        guildMember: member,
        guildConfig,
        client: this.client,
      });
      if (
        command.permissions.some((e) =>
          userPermissions.notFulfilledPermissions.includes(e),
        ) // 충족되지 않은 권한중에 커맨드에서 필요한 권한이 있다면 명령어 사용 불가
      ) {
        span.setData("endReason", "commandPermissionsNotFulfilled");
        span.setData(
          "missingPermissions",
          userPermissions.notFulfilledPermissions,
        );
        span.setHttpStatus(403);
        transaction.finish();
        await interaction.reply({
          ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
          content:
            userPermissions.notFulfilledPermissions.length === 1 // 필요한 권한이 1개라면
              ? format(
                  interaction.locale, // 단일 구문으로 출력 (ex: COMMAND_MISSING_USER_DJ
                  ("COMMAND_MISSING_USER_PERMISSION_" +
                    userPermissions.notFulfilledPermissions[0]) as STRING_KEYS,
                )
              : format(
                  interaction.locale, // 여러개라면 (ex: COMMAND_MISSING_USER_PERMISSIONS
                  "COMMAND_MISSING_USER_PERMISSIONS",
                  userPermissions.notFulfilledPermissions
                    .map(
                      (e) =>
                        "``" +
                        format(
                          interaction.locale,
                          ("PERMISSIONS_" + e) as STRING_KEYS,
                        ) +
                        "``", // 권한 이름을 현지화
                    )
                    .join(", "),
                ),
        });
        return;
      }
      //#endregion

      //#region Check default channel
      if (!member.permissions.has("Administrator")) {
        // DB에 들어가는건 Text Based, 캐스팅해줌
        const defaultTextChannel: Discord.TextBasedChannel | null =
          guildConfig.textChannelId
            ? ((await interaction.guild.channels.fetch(
                guildConfig.textChannelId,
              )) as Discord.TextBasedChannel)
            : null;
        // DB에 들어가는건 Voice Based, 캐스팅해줌
        const defaultVoiceChannel: Discord.VoiceBasedChannel | null =
          guildConfig.voiceChannelId
            ? ((await interaction.guild.channels.fetch(
                guildConfig.voiceChannelId,
              )) as Discord.VoiceBasedChannel)
            : null;
        // 기본 텍스트 채널이 존재하고, 명령어 사용한 채널과 기본 채널이 다르다면, 명령어 사용 금지
        if (
          defaultTextChannel &&
          defaultTextChannel.id !== interaction.channelId
        ) {
          span.setData("endReason", "defaultTextChannel");
          span.setHttpStatus(403);
          transaction.finish();
          await interaction.reply({
            ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
            content: format(
              interaction.locale,
              "DEFAULT_TEXT_CHANNEL",
              defaultTextChannel.id,
            ),
          });
          return;
        }
        // 봇은 채널에 연결되어 있지 않고, 명령어 사용한 사람이 보이스에 연결되어있는 경우 확인
        if (
          !interaction.guild.members.me.voice.channelId &&
          defaultVoiceChannel &&
          member.voice.channel &&
          defaultVoiceChannel.id !== member.voice.channel.id
        ) {
          span.setData("endReason", "defaultVoiceChannel");
          span.setHttpStatus(403);
          transaction.finish();
          await interaction.reply({
            ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
            content: format(
              interaction.locale,
              "DEFAULT_VOICE_CHANNEL",
              defaultVoiceChannel.id,
            ),
          });
          return;
        }
      }
      //#endregion

      // Check command requirements
      const commandRequirements = command.requirements;
      //#region 오디오 노드 있을때만 사용 가능한 명령어 처리
      if (
        commandRequirements & KafuuCommandFlags.AUDIO_NODE &&
        [...this.client.audio.nodes.values()].filter(
          (e) => e.state == Constants.State.CONNECTED,
        ).length == 0
      ) {
        span.setData("endReason", "noNodesAvailable");
        span.setHttpStatus(500);
        transaction.finish();
        await interaction.reply({
          ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
          content: format(interaction.locale, "NO_NODES_AVAILABLE"),
        });
        return;
      }
      //#endregion

      //#region 노래 재생 중에만 사용 가능한 명령어 처리
      if (
        commandRequirements & KafuuCommandFlags.TRACK_PLAYING &&
        !this.client.audio.hasPlayerDispatcher(interaction.guildId)
      ) {
        span.setData("endReason", "availableOnlyPlaying");
        span.setHttpStatus(403);
        transaction.finish();
        await interaction.reply({
          ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
          content: format(interaction.locale, "AVAILABLE_ONLY_PLAYING"),
        });
        return;
      }
      //#endregion

      //#region 사용자가 음성 채널에 접속되어 있을 때만 사용 가능한 명령어
      if (
        commandRequirements & KafuuCommandFlags.VOICE_CONNECTED &&
        !member.voice.channelId
      ) {
        span.setData("endReason", "availableOnlyVoice");
        span.setHttpStatus(403);
        transaction.finish();
        await interaction.reply({
          ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
          content: format(interaction.locale, "JOIN_VOICE_FIRST"),
        });
        return;
      }
      //#endregion

      //#region  같은 음성 채널에 접속해있는지 확인
      if (
        commandRequirements & KafuuCommandFlags.VOICE_SAME_CHANNEL &&
        member.voice.channelId &&
        interaction.guild.members.me.voice.channelId &&
        member.voice.channelId !== interaction.guild.members.me.voice.channelId
      ) {
        span.setData("endReason", "voiceSameChannel");
        span.setHttpStatus(403);
        transaction.finish();
        await interaction.reply({
          ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
          content: format(
            interaction.locale,
            "SAME_VOICE_CHANNEL",
            interaction.guild.members.me.voice.channelId,
          ),
        });
        return;
      }
      //#endregion

      //#region 듣기 켜져있는지 확인
      if (
        commandRequirements & KafuuCommandFlags.LISTEN_STATUS &&
        member.voice.channelId &&
        member.voice.deaf
      ) {
        span.setData("endReason", "listenStatus");
        span.setHttpStatus(403);
        transaction.finish();
        await interaction.reply({
          ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
          content: format(interaction.locale, "LISTEN_FIRST"),
        });
        return;
      }
      //#endregion

      //#region 명령어 실행
      await command.onCommandInteraction({
        interaction,
        userPermissions: userPermissions.fulfilledPermissions,
      });
      this.log.info(
        `Command successfully executed (${this.cmdInfoStr(interaction)}) ${
          interaction.user.id
        }@${interaction.guildId}[${interaction.channelId}]`,
      );
      span.setData("endReason", "ok");
      span.setHttpStatus(200);
      span.finish();
      transaction.finish();
      //#endregion
    } catch (error) {
      this.log.error(
        `Command failed to execute (${this.cmdInfoStr(interaction)}) ${
          interaction.user.id
        }@${interaction.guildId}[${interaction.channelId}]`,
        error,
      );

      const exceptionId: string = Sentry.captureException(error);
      const payload: Discord.InteractionReplyOptions = {
        ephemeral: SYSTEM_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "COMMAND_HANDLE_ERROR"),
      };
      span.setData("endReason", "error");
      span.setData("exceptionId", exceptionId);
      span.setHttpStatus(500);
      span.finish();
      transaction.finish();
      try {
        if (interaction.deferred) await interaction.editReply(payload);
        else if (interaction.replied) await interaction.followUp(payload);
        else await interaction.reply(payload);
      } catch (error) {
        this.log.warn(`Failed to reply error message ${exceptionId}`, error);
        return;
      }
    }
  }

  // Handle command interaction type
  private async handleAutoComplete(
    interaction: Discord.AutocompleteInteraction,
    transaction: Transaction,
  ): Promise<void> {
    const span: Span = transaction.startChild({
      op: "InteractionCreateEvent#handleAutoComplete",
      description: "Handle autocomplete interaction",
    });
    span.setData("commandName", interaction.commandName);

    const command: BaseCommand | undefined = this.client.commands.get(
      interaction.commandName,
    );
    if (!command) {
      span.setData("endReason", "commandNotFound");
      span.setHttpStatus(404);
      span.finish();
      transaction.finish();

      await interaction.respond([
        { name: "AutoComplete command not found.", value: "Error" },
      ]);
      return;
    }
    try {
      await command.onAutocompleteInteraction?.(interaction);
      span.setData("endReson", "ok");
      span.setHttpStatus(200);
      span.finish();
      transaction.finish();
    } catch (error) {
      this.log.error(
        `Failed to handle autocomplete command ${interaction.commandName}`,
        error,
      );
      if (!interaction.responded) await interaction.respond([]);
      const exceptionId = Sentry.captureException(error);
      span.setData("endReason", "error");
      span.setData("exceptionId", exceptionId);
      span.setHttpStatus(500);
      span.finish();
      transaction.finish();
    }
  }

  private parseCustomId(
    interaction: Discord.MessageComponentInteraction,
  ): KafuuMessageComponentCustomIdOptions | null {
    // [commandName]:[customId]:[executorId?];[ARG1];[ARG2];[ARG3];[ARG...]
    // [commandName]:[customId]:;[ARG1];[ARG2];[ARG3];[ARG...]
    const handlerInfo = interaction.customId.trim().split(":");
    const args = interaction.customId.trim().split(";");
    if (handlerInfo.length < 2) return null; // When commandName

    return {
      commandName: handlerInfo[0],
      customId: handlerInfo[1],
      executorId:
        handlerInfo[2].split(";")[0].length == 0
          ? undefined
          : handlerInfo[2].split(";")[0],
      args:
        args.slice(1, args.length)[0] == "" ? [] : args.slice(1, args.length),
    };
  }

  private async handleMessageComponent(
    interaction: Discord.MessageComponentInteraction,
    transaction: Transaction,
  ) {
    this.log.debug(
      `MessageComponent received, Interaction id: ${interaction.id} custom id: ${interaction.customId}`,
    );
    const span: Span = transaction.startChild({
      op: "InteractionCreateEvent#handleMessageComponent",
      description: "Handle message component interaction",
    });
    span.setData("customId", interaction.customId);

    const parsedCustomId = this.parseCustomId(interaction);
    if (!parsedCustomId) {
      span.setHttpStatus(400);
      span.setData("endReason", "invalidCustomId");
      span.finish();
      transaction.finish();
      this.client.log.warn("Failed to handle interaction, invalid custom id.");
      await interaction.update({
        content: format(interaction.locale, "INVALID_CUSTOM_ID"),
      });
      return;
    }

    if (
      parsedCustomId.executorId &&
      parsedCustomId.executorId != interaction.user.id
    ) {
      span.setHttpStatus(403);
      span.setData("endReason", "invalidExecutor");
      span.finish();
      transaction.finish();
      this.client.log.warn("Failed to handle interaction, invalid executor.");
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "INTERACTION_ONLY_SAME_EXECUTOR"),
      });
      return;
    }

    const command = this.client.commands.get(parsedCustomId.commandName);
    if (!command) {
      span.setHttpStatus(404);
      span.setData("endReason", "commandNotFound");
      span.finish();
      transaction.finish();
      this.client.log.warn(
        "Failed to handle message component interaction, command name not found.",
      );
      await interaction.update({
        content: format(interaction.locale, "INVALID_CUSTOM_ID"),
      });
      return;
    }

    const member: Discord.GuildMember | undefined =
      interaction.guild?.members.cache.get(interaction.user.id) ??
      (await interaction.guild?.members.fetch(interaction.user.id));

    if (!member || !interaction.inGuild()) {
      span.setHttpStatus(403);
      span.setData("endReason", "notInGuild");
      span.finish();
      transaction.finish();
      this.client.log.warn(
        "Failed to handle message component interaction, user not in guild.",
      );
      await interaction.update({
        content: format(interaction.locale, "NOT_IN_GUILD"),
        components: [],
      });
      return;
    }

    const userPermissions = await getUserPermissions({
      client: this.client,
      guildConfig: await this.client.databaseHelper.upsertAndFindGuild(
        interaction.guildId,
      ),
      guildMember: member,
    });

    try {
      switch (true) {
        case interaction.isRoleSelectMenu():
          await command.onRoleSelectMenuInteraction?.({
            interaction: interaction as Discord.RoleSelectMenuInteraction,
            userPermissions: userPermissions.fulfilledPermissions,
            customInfo: parsedCustomId,
          });
          break;
        case interaction.isChannelSelectMenu():
          await command.onChannelSelectMenuInteraction?.({
            interaction: interaction as Discord.ChannelSelectMenuInteraction,
            userPermissions: userPermissions.fulfilledPermissions,
            customInfo: parsedCustomId,
          });
          break;
        case interaction.isButton():
          await command.onButtonInteraction?.({
            interaction: interaction as Discord.ButtonInteraction,
            userPermissions: userPermissions.fulfilledPermissions,
            customInfo: parsedCustomId,
          });
          break;
        default:
          span.setHttpStatus(400);
          span.setData("endReason", "invalidComponentType");
          span.finish();
          transaction.finish();
          Sentry.captureEvent({ message: "Invalid component type" });
          this.client.log.warn(
            "Failed to handle message component interaction, invalid component type.",
          );
      }
      this.log.info(`Handled message component: ${interaction.customId}`);
    } catch (error) {
      this.log.error(
        `Failed to handle message component ${interaction.componentType} ${parsedCustomId.commandName}`,
        error,
      );
      const exceptionId = Sentry.captureException(error);
      span.setData("endReason", "error");
      span.setData("exceptionId", exceptionId);
      span.setHttpStatus(500);
      span.finish();
      transaction.finish();
    }
  }
}
