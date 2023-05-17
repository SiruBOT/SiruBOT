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
  ChannelSelectMenuBuilder,
  ChannelType,
} from "discord.js";
import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuButtonContext,
  KafuuChannelSelectMenuContext,
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
  EMOJI_STAR,
  EMOJI_TRASH,
  SPARKLES_EMOJI,
} from "@/constants/message";
import { EMOJI_REPEAT } from "@/constants/message";
import { STRING_KEYS } from "@/types/locales";
import { COMMAND_WARN_MESSAGE_EPHEMERAL } from "@/constants/events/InteractionCreateEvent";
import { MessageComponentRenderContext } from "@/types/utils";
import { KafuuRepeatMode } from "@/types/audio";

const PAGES = {
  MAIN: "main",
  DJ: "dj",
  MUSIC: "music",
  CHANNELS: "channels",
} as const;

const CUSTOM_IDS = {
  GOTO_DJ: "goto_" + PAGES.DJ,
  GOTO_MUSIC: "goto_" + PAGES.MUSIC,
  GOTO_CHANNELS: "goto_" + PAGES.CHANNELS,
  DJ_ROLE_SET: PAGES.DJ + "_role_set",
  GOTO_MAIN: "goto_" + PAGES.MAIN,
  DJ_ROLE_RESET: PAGES.DJ + "_role_reset",
  DEFAULT_TEXT_SET: "default_text_set",
  DEFAULT_VOICE_SET: "default_voice_set",
  TEXT_RESET: "text_reset",
  VOICE_RESET: "voice_reset",
  MUSIC_PLAYMESSAGE_TOGGLE: "playmessage_toggle",
  MUSIC_RELATED_TOGGLE: "related_toggle",
  MUSIC_REPEAT_SET: "repeat_set",
};

type SettingsPageNames = typeof PAGES[keyof typeof PAGES];

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

  //#region Handlers
  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    const payload = await this.render<true>({
      page: PAGES.MAIN,
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
    customInfo: { customId, args },
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

    let pageName = "";
    // SettingsCommand custom id name rule
    if (customId.startsWith("goto_")) {
      // goto_{pageName}
      pageName = customId.split("_")[1];
    } else {
      switch (customId) {
        // Reset DJ Role
        case CUSTOM_IDS.DJ_ROLE_RESET:
          await this.client.databaseHelper.upsertAndFindGuild(
            interaction.guildId,
            {
              djRoleId: null,
            }
          );
          pageName = PAGES.DJ;
          break;
        // Reset Default Text Channel
        case CUSTOM_IDS.TEXT_RESET:
          await this.client.databaseHelper.upsertAndFindGuild(
            interaction.guildId,
            {
              textChannelId: null,
            }
          );
          pageName = PAGES.CHANNELS;
          break;
        // Reset Default Voice Channel
        case CUSTOM_IDS.VOICE_RESET:
          await this.client.databaseHelper.upsertAndFindGuild(
            interaction.guildId,
            {
              voiceChannelId: null,
            }
          );
          pageName = PAGES.CHANNELS;
          break;
        // Toggle Play Message
        case CUSTOM_IDS.MUSIC_PLAYMESSAGE_TOGGLE:
          const sendAudioMessagesArg = args?.[0];
          if (sendAudioMessagesArg) {
            await this.client.databaseHelper.upsertAndFindGuild(
              interaction.guildId,
              {
                sendAudioMessages: JSON.parse(sendAudioMessagesArg),
              }
            );
          }
          pageName = PAGES.MUSIC;
          break;
        // Toggle Play Related Videos
        case CUSTOM_IDS.MUSIC_RELATED_TOGGLE:
          const sendRelatedVideosArg = args?.[0];
          if (sendRelatedVideosArg) {
            await this.client.databaseHelper.upsertAndFindGuild(
              interaction.guildId,
              {
                playRelated: JSON.parse(sendRelatedVideosArg),
              }
            );
          }
          pageName = PAGES.MUSIC;
          break;
        case CUSTOM_IDS.MUSIC_REPEAT_SET:
          const repeatArg = args?.[0];
          if (repeatArg) {
            await this.client.databaseHelper.upsertAndFindGuild(
              interaction.guildId,
              {
                repeat: Number(repeatArg),
              }
            );
          }
          pageName = PAGES.MUSIC;
          break;
      }
    }

    const payload = await this.render<false>({
      page: pageName as SettingsPageNames,
      context: {
        guild: interaction.guild,
        member: interaction.member as GuildMember,
        locale: interaction.locale,
      },
    });
    await interaction.update(payload);
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
    const role = interaction.roles.first();
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
        page: PAGES.DJ,
      });
      await interaction.update(payload);
      return;
    }
  }

  public override async onChannelSelectMenuInteraction({
    interaction,
    userPermissions,
    customInfo: { customId },
  }: KafuuChannelSelectMenuContext) {
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

    const toSet = interaction.channels.first();

    switch (customId) {
      case CUSTOM_IDS.DEFAULT_TEXT_SET:
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guild.id,
          {
            textChannelId: toSet?.id ? toSet.id : null,
          }
        );
        break;
      case CUSTOM_IDS.DEFAULT_VOICE_SET:
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guild.id,
          {
            voiceChannelId: toSet?.id ? toSet.id : null,
          }
        );
        break;
    }

    const payload = await this.render<false>({
      context: {
        guild: interaction.guild,
        locale: interaction.locale,
        member: interaction.member as GuildMember,
      },
      page: PAGES.CHANNELS,
    });
    await interaction.update(payload);
    return;
  }
  //#endregion

  // Menu
  private async render<IsReply extends boolean>(
    opts: RenderOptions
  ): ReplyOrUpdate<IsReply> {
    switch (opts.page) {
      case PAGES.MAIN:
        return await this.renderMain<IsReply>(opts);
      case PAGES.DJ:
        return await this.renderDJ(opts);
      case PAGES.MUSIC:
        return await this.renderMusic(opts);
      case PAGES.CHANNELS:
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
    ];
    //#endregion
    //#region buttons
    const buttons = [
      new ButtonBuilder()
        .setLabel(format(locale, "SETTINGS_MAIN_BUTTONS_GOTO_DJ"))
        .setCustomId(
          this.getCustomId({
            customId: CUSTOM_IDS.GOTO_DJ,
            executorId: member.id,
          })
        )
        .setEmoji("💿")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(format(locale, "SETTINGS_MAIN_BUTTONS_GOTO_MUSIC"))
        .setCustomId(
          this.getCustomId({
            customId: CUSTOM_IDS.GOTO_MUSIC,
            executorId: member.id,
          })
        )
        .setEmoji("🎵")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(format(locale, "SETTINGS_MAIN_BUTTONS_GOTO_CHANNELS"))
        .setCustomId(
          this.getCustomId({
            customId: CUSTOM_IDS.GOTO_CHANNELS,
            executorId: member.id,
          })
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
        this.getCustomId({
          customId: CUSTOM_IDS.DJ_ROLE_SET,
          executorId: member.id,
        })
      )
      .setMaxValues(1)
      .setMinValues(1)
      .setPlaceholder(format(locale, "SETTINGS_DJ_PANEL_SELECT_PLACEHOLDER"));
    const buttons = [
      new ButtonBuilder()
        .setCustomId(
          this.getCustomId({
            customId: CUSTOM_IDS.GOTO_MAIN,
            executorId: member.id,
          })
        )
        .setLabel(format(locale, "SETTINGS_BACK_BUTTON"))
        .setEmoji(EMOJI_BACK)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(
          this.getCustomId({
            customId: CUSTOM_IDS.DJ_ROLE_RESET,
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
    const { sendAudioMessages, playRelated, repeat } =
      await this.client.databaseHelper.upsertAndFindGuild(guild.id);
    const nextRepeat =
      repeat === KafuuRepeatMode.OFF
        ? KafuuRepeatMode.ALL
        : repeat === KafuuRepeatMode.ALL
        ? KafuuRepeatMode.SINGLE
        : KafuuRepeatMode.OFF;
    return {
      embeds: [
        this.createSettingsEmbed({
          locale,
          guild,
        })
          .setTitle(format(locale, "SETTINGS_MUSIC_PANEL_TITLE"))
          .setDescription(format(locale, "SETTINGS_MUSIC_PANEL_DESCRIPTION"))
          .addFields([
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
          ]),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents([
          new ButtonBuilder()
            .setCustomId(
              this.getCustomId({
                customId: CUSTOM_IDS.MUSIC_PLAYMESSAGE_TOGGLE,
                args: [`${!sendAudioMessages}`],
              })
            )
            .setLabel(
              format(
                locale,
                sendAudioMessages
                  ? "SETTINGS_MUSIC_PLAYMESSAGE_BTN_OFF"
                  : "SETTINGS_MUSIC_PLAYMESSAGE_BTN_ON"
              )
            )
            .setEmoji("📨")
            .setStyle(
              sendAudioMessages ? ButtonStyle.Secondary : ButtonStyle.Primary
            ),
          new ButtonBuilder()
            .setCustomId(
              this.getCustomId({
                customId: CUSTOM_IDS.MUSIC_RELATED_TOGGLE,
                args: [`${!playRelated}`],
              })
            )
            .setLabel(
              format(
                locale,
                playRelated
                  ? "SETTINGS_MUSIC_RELATED_BTN_OFF"
                  : "SETTINGS_MUSIC_RELATED_BTN_ON"
              )
            )
            .setEmoji(EMOJI_STAR)
            .setStyle(
              playRelated ? ButtonStyle.Secondary : ButtonStyle.Primary
            ),
        ]),
        new ActionRowBuilder<ButtonBuilder>().addComponents([
          new ButtonBuilder()
            .setCustomId(
              this.getCustomId({
                customId: CUSTOM_IDS.GOTO_MAIN,
                executorId: member.id,
              })
            )
            .setLabel(format(locale, "SETTINGS_BACK_BUTTON"))
            .setEmoji(EMOJI_BACK)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(
              this.getCustomId({
                customId: CUSTOM_IDS.MUSIC_REPEAT_SET,
                args: [`${nextRepeat}`],
              })
            )
            .setLabel(
              format(
                locale,
                ("SETTINGS_MUSIC_REPEAT_BTN_" + nextRepeat) as STRING_KEYS
              )
            )
            // eslint-disable-next-line security/detect-object-injection
            .setEmoji(EMOJI_REPEAT[nextRepeat])
            .setStyle(ButtonStyle.Secondary),
        ]),
      ],
    };
  }

  private async renderChannels<IsReply extends boolean>({
    context: { locale, guild, member },
  }: RenderOptions): ReplyOrUpdate<IsReply> {
    const { textChannelId, voiceChannelId } =
      await this.client.databaseHelper.upsertAndFindGuild(guild.id);
    const [textChannel, voiceChannel] = await Promise.all([
      textChannelId ? guild.channels.fetch(textChannelId) : null,
      voiceChannelId ? guild.channels.fetch(voiceChannelId) : null,
    ]);
    return {
      embeds: [
        this.createSettingsEmbed({
          locale,
          guild,
        })
          .setTitle(format(locale, "SETTINGS_CHANNELS_PANEL_TITLE"))
          .setDescription(format(locale, "SETTINGS_CHANNELS_PANEL_DESCRIPTION"))
          .addFields(
            [
              {
                name: format(locale, "SETTINGS_MAIN_FIELDS_TEXTCH"),
                value: textChannel
                  ? `<#${textChannel.id}>`
                  : format(locale, "SETTINGS_TEXTCH_NONE"),
              },
              {
                name: format(locale, "SETTINGS_MAIN_FIELDS_VOICECH"),
                value: voiceChannel
                  ? `<#${voiceChannel.id}>`
                  : format(locale, "SETTINGS_VOICECH_NONE"),
              },
            ].map((e) => {
              return { ...e, inline: true };
            })
          ),
      ],
      components: [
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents([
          new ChannelSelectMenuBuilder()
            .setPlaceholder(
              format(locale, "SETTINGS_CHANNELS_TEXT_PLACEHOLDER")
            )
            .setCustomId(
              this.getCustomId({
                customId: CUSTOM_IDS.DEFAULT_TEXT_SET,
                executorId: member.id,
              })
            )
            .setChannelTypes(ChannelType.GuildText)
            .setMaxValues(1)
            .setMinValues(0),
        ]),
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents([
          new ChannelSelectMenuBuilder()
            .setPlaceholder(
              format(locale, "SETTINGS_CHANNELS_VOICE_PLACEHOLDER")
            )
            .setCustomId(
              this.getCustomId({
                customId: CUSTOM_IDS.DEFAULT_VOICE_SET,
                executorId: member.id,
              })
            )
            .setChannelTypes(ChannelType.GuildVoice)
            .setMaxValues(1)
            .setMinValues(0),
        ]),
        new ActionRowBuilder<ButtonBuilder>().addComponents([
          new ButtonBuilder()
            .setCustomId(
              this.getCustomId({
                customId: CUSTOM_IDS.GOTO_MAIN,
                executorId: member.id,
              })
            )
            .setLabel(format(locale, "SETTINGS_BACK_BUTTON"))
            .setEmoji(EMOJI_BACK)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setEmoji(EMOJI_TRASH)
            .setLabel(format(locale, "SETTINGS_CHANNELS_REMOVE_TEXT"))
            .setStyle(ButtonStyle.Danger)
            .setCustomId(
              this.getCustomId({
                customId: CUSTOM_IDS.TEXT_RESET,
                executorId: member.id,
              })
            )
            .setDisabled(!textChannel),
          new ButtonBuilder()
            .setEmoji(EMOJI_TRASH)
            .setLabel(format(locale, "SETTINGS_CHANNELS_REMOVE_VOICE"))
            .setStyle(ButtonStyle.Danger)
            .setCustomId(
              this.getCustomId({
                customId: CUSTOM_IDS.VOICE_RESET,
                executorId: member.id,
              })
            )
            .setDisabled(!voiceChannel),
        ]),
      ],
    };
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
