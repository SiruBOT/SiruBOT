import {
  InteractionReplyOptions,
  SlashCommandBuilder,
  ActionRowBuilder,
  Guild,
  GuildMember,
  ButtonBuilder,
  ButtonStyle,
  Locale,
  RoleSelectMenuBuilder,
  InteractionUpdateOptions,
} from "discord.js";
import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuButtonContext,
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
  KafuuRoleSelectMenuContext,
} from "@/types/command";
import { EmbedFactory } from "@/utils/embed";
import { format } from "@/locales";
import {
  BOT_NAME,
  DASHBOARD_URL,
  EMOJI_BACK,
  EMOJI_TRASH,
  SPARKLES_EMOJI,
} from "@/constants/message";
import { EMOJI_REPEAT } from "@/constants/message";
import { volumeEmoji } from "@/utils/formatter";
import { STRING_KEYS } from "@/types/locales";
import {
  COMMAND_WARN_MESSAGE_EPHEMERAL,
  SYSTEM_MESSAGE_EPHEMERAL,
} from "@/constants/events/InteractionCreateEvent";
import { MessageComponentRenderContext } from "@/types/utils";

type SettingsPageNames = "main" | "dj" | "music" | "channels";

type RenderOptions = {
  page: SettingsPageNames;
  context: MessageComponentRenderContext;
};

type ReplyOrUpdate<IsReply extends boolean> = Promise<
  IsReply extends true ? InteractionReplyOptions : InteractionUpdateOptions
>;

class SettingsCommand extends BaseCommand {
  constructor(client: KafuuClient) {
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
      KafuuCommandCategory.ADMIN,
      [KafuuCommandPermission.ADMIN],
      KafuuCommandFlags.NOTHING,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    const payload = await this.render<true>({
      page: "main",
      context: {
        guild: interaction.guild,
        member: interaction.member,
        locale: interaction.locale,
      },
    });
    await interaction.reply(payload);
  }

  // Define an asynchronous method named onButtonInteraction
  public override async onButtonInteraction({
    interaction,
    customInfo: { customId },
    userPermissions,
  }: KafuuButtonContext): Promise<void> {
    if (!interaction.guild || !interaction.guildId) return;
    if (!interaction.member || !interaction.user) return;
    // Button context, userPermissions if user permission not ncludes KafuuCommandPermission.ADMIN
    if (!userPermissions.includes(KafuuCommandPermission.ADMIN)) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "INTERACTION_ONLY_ADMIN"),
      });
      return;
    }
    // SettingsCommand custom id name rule
    if (customId.startsWith("goto_")) {
      // goto_{pageName}
      const pageName = customId.split("_")[1];
      const payload = await this.render<false>({
        page: pageName as SettingsPageNames,
        context: {
          guild: interaction.guild,
          member: interaction.member as GuildMember,
          locale: interaction.locale,
        },
      });
      await interaction.update(payload);
      return;
    }
    if (customId == "dj_role_reset") {
      await this.client.databaseHelper.upsertAndFindGuild(interaction.guildId, {
        djRoleId: null,
      });
      const payload = await this.render<false>({
        context: {
          guild: interaction.guild,
          locale: interaction.locale,
          member: interaction.member as GuildMember,
        },
        page: "dj",
      });
      await interaction.update(payload);
      return;
    }
  }

  public override async onRoleSelectMenuInteraction({
    interaction,
    userPermissions,
  }: KafuuRoleSelectMenuContext) {
    if (!interaction.guild || !interaction.guildId) return;
    if (!interaction.member || !interaction.user) return;
    // RoleSelectMenu, If interaction user does not have permission 'admin' reject the interaction
    if (!userPermissions.includes(KafuuCommandPermission.ADMIN)) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "INTERACTION_ONLY_ADMIN"),
      });
      return;
    }
    // Managed role check
    const role = interaction.roles.first(); // Nullable
    if (role && role.managed) {
      await interaction.reply({
        ephemeral: COMMAND_WARN_MESSAGE_EPHEMERAL,
        content: format(interaction.locale, "SETTINGS_DJ_ROLE_MANAGED_ROLE"),
      });
      return;
    }

    if (role) {
      await this.client.databaseHelper.upsertAndFindGuild(interaction.guildId, {
        djRoleId: role.id,
      });
      const payload = await this.render<false>({
        context: {
          guild: interaction.guild,
          locale: interaction.locale,
          member: interaction.member as GuildMember,
        },
        page: "dj",
      });
      await interaction.update(payload);
      return;
    }
  }

  private async render<IsReply extends boolean>(
    opts: RenderOptions
  ): ReplyOrUpdate<IsReply> {
    switch (opts.page) {
      case "main":
        return await this.renderMain<IsReply>(opts);
      case "dj":
        return await this.renderDJ(opts);
      case "music":
        return await this.renderMusic(opts);
      case "channels":
        return await this.renderChannels(opts);
    }
  }

  private async renderMain<IsReply extends boolean>({
    context: { locale, guild, member },
  }: RenderOptions): ReplyOrUpdate<IsReply> {
    const {
      djRoleId,
      playRelated,
      repeat,
      sendAudioMessages,
      textChannelId,
      volume,
      voiceChannelId,
    } = await this.client.databaseHelper.upsertAndFindGuild(guild.id); // Query the database for the guild's settings
    const mainEmbed = this.createSettingsEmbed({ locale, guild });
    const djRoleObj = djRoleId && (await guild.roles.fetch(djRoleId));
    //#region embed fields
    const fields = [
      [
        format(locale, "SETTINGS_MAIN_FIELDS_DJ"),
        djRoleObj ? `<@&${djRoleObj.id}>` : format(locale, "SETTINGS_DJ_NONE"),
      ],
      [
        format(locale, "SETTINGS_MAIN_FIELDS_TEXTCH"),
        textChannelId
          ? `<#${textChannelId}>`
          : format(locale, "SETTINGS_TEXTCH_NONE"),
      ],
      [
        format(locale, "SETTINGS_MAIN_FIELDS_VOICECH"),
        voiceChannelId
          ? `<#${voiceChannelId}>`
          : format(locale, "SETTINGS_VOICECH_NONE"),
      ],
      [
        format(locale, "SETTINGS_MAIN_FIELDS_PLAYMESSAGE"),
        format(locale, sendAudioMessages ? "ON" : "OFF"),
      ],
      [
        format(locale, "SETTINGS_MAIN_FIELDS_RELATED"),
        format(locale, playRelated ? "ON" : "OFF"),
      ],
      [
        // eslint-disable-next-line security/detect-object-injection
        format(locale, "SETTINGS_MAIN_FIELDS_REPEAT", EMOJI_REPEAT[repeat]),
        format(locale, ("REPEAT_" + repeat) as STRING_KEYS),
      ],
      [
        format(locale, "SETTINGS_MAIN_FIELDS_VOLUME", volumeEmoji(volume)),
        `**${volume.toString()}**%`,
      ],
    ];
    //#endregion
    //#region buttons
    const buttons = [
      new ButtonBuilder()
        .setLabel(format(locale, "SETTINGS_MAIN_BUTTONS_GOTO_DJ"))
        .setCustomId(
          this.getCustomId({
            customId: "goto_dj",
            executorId: member.id,
          })
        )
        .setEmoji("💿")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(format(locale, "SETTINGS_MAIN_BUTTONS_GOTO_MUSIC"))
        .setCustomId(
          this.getCustomId({ customId: "goto_music", executorId: member.id })
        )
        .setEmoji("🎵")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(format(locale, "SETTINGS_MAIN_BUTTONS_GOTO_CHANNELS"))
        .setCustomId(
          this.getCustomId({ customId: "goto_channels", executorId: member.id })
        )
        .setEmoji("📑")
        .setStyle(ButtonStyle.Secondary),
    ];
    // -------------------------------------------- Development -------------------------------------------- //
    if (process.env.NODE_ENV === "development") {
      buttons.push(
        new ButtonBuilder()
          .setEmoji(SPARKLES_EMOJI)
          .setLabel(format(locale, "SETTINGS_DASHBOARD_BUTTON"))
          .setURL(DASHBOARD_URL + guild.id)
          .setStyle(ButtonStyle.Link)
      );
    }
    // -------------------------------------------- Development -------------------------------------------- //
    //#endregion
    const mainActionRow = new ActionRowBuilder<ButtonBuilder>();
    mainActionRow.addComponents(buttons);
    mainEmbed.addFields(
      fields.map((e) => ({ name: e[0], value: e[1], inline: true }))
    );

    return {
      embeds: [mainEmbed],
      components: [mainActionRow],
    };
  }

  private async renderDJ<IsReply extends boolean>({
    context: { locale, guild, member },
  }: RenderOptions): ReplyOrUpdate<IsReply> {
    const { djRoleId } = await this.client.databaseHelper.upsertAndFindGuild(
      guild.id
    );
    // const mainActionRow = new ActionRowBuilder<ButtonBuilder>();
    const djRoleObj = djRoleId && (await guild.roles.fetch(djRoleId));
    const mainEmbed = this.createSettingsEmbed({
      locale,
      guild,
    })
      .setDescription(format(locale, "SETTINGS_DJ_PANEL_DESCRIPTION"))
      .setTitle(format(locale, "SETTINGS_DJ_PANEL_TITLE"))
      .addFields([
        {
          name: format(locale, "SETTINGS_MAIN_FIELDS_DJ"),
          value: djRoleObj
            ? `<@&${djRoleObj.id}>`
            : format(locale, "SETTINGS_DJ_NONE"),
        },
      ]);
    const roleSelectMenu = new RoleSelectMenuBuilder()
      .setCustomId(
        this.getCustomId({ customId: "dj_role_set", executorId: member.id })
      )
      .setMaxValues(1)
      .setMinValues(1)
      .setPlaceholder(format(locale, "SETTINGS_DJ_PANEL_SELECT_PLACEHOLDER"));
    const buttons = [
      new ButtonBuilder()
        .setCustomId(
          this.getCustomId({ customId: "goto_main", executorId: member.id })
        )
        .setLabel(format(locale, "SETTINGS_BACK_BUTTON"))
        .setEmoji(EMOJI_BACK)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(
          this.getCustomId({
            customId: "dj_role_reset",
            executorId: member.id,
          })
        )
        .setStyle(ButtonStyle.Danger)
        .setEmoji(EMOJI_TRASH)
        .setLabel(format(locale, "SETTINGS_DJ_REMOVE"))
        .setDisabled(!djRoleObj),
    ];
    const roleActionRow =
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents([
        roleSelectMenu,
      ]);
    const buttonActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttons
    );

    return {
      embeds: [mainEmbed],
      components: [roleActionRow, buttonActionRow],
    };
  }

  private async renderMusic<IsReply extends boolean>({
    context: { locale, guild, member },
  }: RenderOptions): ReplyOrUpdate<IsReply> {
    const { sendAudioMessages, playRelated, repeat, volume } =
      await this.client.databaseHelper.upsertAndFindGuild(guild.id);
    return {
      embeds: [
        this.createSettingsEmbed({
          locale,
          guild,
        })
          .setTitle(format(locale, "SETTINGS_MUSIC_PANEL_TITLE"))
          .setDescription(format(locale, "SETTINGS_MUSIC_PANEL_DESCRIPTION"))
          .addFields(
            [
              {
                name: format(locale, "SETTINGS_MAIN_FIELDS_PLAYMESSAGE"),
                value: format(locale, sendAudioMessages ? "ON" : "OFF"),
              },
              {
                name: format(locale, "SETTINGS_MAIN_FIELDS_RELATED"),
                value: format(locale, playRelated ? "ON" : "OFF"),
              },
              {
                // eslint-disable-next-line security/detect-object-injection
                name: format(
                  locale,
                  "SETTINGS_MAIN_FIELDS_REPEAT",
                  // eslint-disable-next-line security/detect-object-injection
                  EMOJI_REPEAT[repeat]
                ),
                value: format(locale, ("REPEAT_" + repeat) as STRING_KEYS),
              },
              {
                name: format(
                  locale,
                  "SETTINGS_MAIN_FIELDS_VOLUME",
                  volumeEmoji(volume)
                ),
                value: `**${volume.toString()}**%`,
              },
            ].map((e) => {
              return { ...e, inline: true };
            })
          ),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents([
          new ButtonBuilder()
            .setCustomId(
              this.getCustomId({ customId: "goto_main", executorId: member.id })
            )
            .setLabel(format(locale, "SETTINGS_BACK_BUTTON"))
            .setEmoji(EMOJI_BACK)
            .setStyle(ButtonStyle.Secondary),
        ]),
      ],
    };
  }

  private async renderChannels<IsReply extends boolean>({
    context: { locale, guild },
  }: RenderOptions): ReplyOrUpdate<IsReply> {
    const mainEmbed = EmbedFactory.createEmbed();
    const mainActionRow = new ActionRowBuilder<ButtonBuilder>();

    return {};
  }

  private createSettingsEmbed({
    locale,
    guild,
  }: {
    locale: Locale;
    guild: Guild;
  }) {
    return EmbedFactory.createEmbed()
      .setTitle(format(locale, "SETTINGS_MAIN_TITLE", BOT_NAME))
      .setFooter({
        iconURL: guild.iconURL() ?? undefined,
        text: format(locale, "SETTINGS_MAIN_FOOTER", guild.name),
      });
  }
}

export default SettingsCommand;
