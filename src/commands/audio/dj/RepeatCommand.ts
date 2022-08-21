import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../../types";
import locale from "../../../locales";
import { Guild } from "../../../database/mysql/entities";
import { EMOJI_REPEAT } from "../../../constant/MessageConstant";

export default class RepeatCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("repeat")
      .setNameLocalizations({
        ko: "반복",
      })
      .setDescription("Sets the repeat mode")
      .setDescriptionLocalizations({
        ko: "반복 모드를 설정해요",
      })
      .addStringOption((option) => {
        option
          .setName("repeat_mode")
          .setNameLocalizations({
            ko: "모드",
          })
          .setDescription("Repeat mode to set")
          .setDescriptionLocalizations({
            ko: "설정할 반복 모드",
          })
          .addChoices(
            {
              name: "Off",
              value: "0",
              name_localizations: {
                ko: "끄기",
              },
            },
            {
              name: "All",
              value: "1",
              name_localizations: {
                ko: "전체",
              },
            },
            {
              name: "One",
              value: "2",
              name_localizations: {
                ko: "한곡",
              },
            }
          );
        return option;
      });
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.DJ],
      {
        audioNode: false,
        trackPlaying: false,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceConnected: false,
        },
      },
      ["SendMessages"]
    );
  }

  public async onCommandInteraction({
    interaction,
    userPermissions,
  }: ICommandContext): Promise<void> {
    const repeatMode: string | null =
      interaction.options.getString("repeat mode");
    if (!repeatMode || !userPermissions.includes(CommandPermissions.DJ)) {
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId
        );
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "REPEAT_STATE",
          EMOJI_REPEAT[guildConfig.repeat], // EMOJI_REPEAT => OFF: "EMOJI", RepeatModeString => (number like string): "OFF"
          locale.format(
            interaction.locale,
            "REPEAT_" + guildConfig.repeat.toString()
          )
        ),
      });
      return;
    } else {
      const guildConfig: Guild =
        await this.client.databaseHelper.upsertAndFindGuild(
          interaction.guildId,
          { repeat: parseInt(repeatMode) }
        );
      await interaction.reply({
        content: locale.format(
          interaction.locale,
          "REPEAT_SET",
          EMOJI_REPEAT[guildConfig.repeat],
          locale.format(
            interaction.locale,
            "REPEAT_" + guildConfig.repeat.toString()
          )
        ),
      });
    }
  }
}
