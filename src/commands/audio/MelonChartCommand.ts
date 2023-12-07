/* eslint-disable @typescript-eslint/no-unused-vars */
import { SlashCommandBuilder } from "discord.js";
import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import type { MelonChart, MelonChartTrackInfo } from "@sirubot/melon-chart-api";
import { Melon } from "@sirubot/melon-chart-api";
import { ExtendedEmbed } from "@/utils/embed";
import { Locale } from "discord.js";
import { format } from "@/locales";
import { melonDateToString } from "@/utils/formatter";
import { chunkArray } from "@/utils/array";
import { PAGE_CHUNK_SIZE } from "@/constants/message";

export default class LyricsCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("melonchart")
      .setNameLocalizations({
        ko: "멜론차트",
      })
      .setDescription("Show melon chart rank!")
      .setDescriptionLocalizations({
        ko: "멜론 차트 순위를 보여드려요!",
      })
      .addSubcommand((subcommand) =>
        subcommand
          .setName("realtime")
          .setDescription("Shows realtime top 100 from melon chart!")
          .setNameLocalizations({
            ko: "실시간",
          })
          .setDescriptionLocalizations({
            ko: "실시간 멜론차트 순위를 보여드려요!",
          })
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("daily")
          .setDescription("Shows daily top 100 from melon chart!")
          .setNameLocalizations({
            ko: "일간",
          })
          .setDescriptionLocalizations({
            ko: "일간 멜론차트 순위를 보여드려요!",
          })
          .addNumberOption((option) =>
            option
              .setName("date")
              .setNameLocalizations({ ko: "날짜" })
              .setDescription("Date of daliy chart")
              .setDescriptionLocalizations({
                ko: "일간 차트의 기준 날짜에요. (년도/월/일) 형식이나, (년도/월), (월/일), (일) 형식으로 입력해주세요.",
              })
          )
      );
    super(
      slashCommand,
      client,
      KafuuCommandCategory.MUSIC,
      [KafuuCommandPermission.EVERYONE],
      KafuuCommandFlags.NOTHING,
      ["SendMessages"]
    );
  }

  public override async onCommandInteraction({
    interaction,
  }: KafuuCommandContext): Promise<void> {
    await interaction.deferReply();

    let data: MelonChart = {
      data: [],
      dates: {
        start: "1970",
        end: "1970",
      },
    };

    const date = interaction.options.getNumber("date", false);
    if (date) {
      const obj = this.validateInput(date.toString());
      interaction.channel?.send(JSON.stringify(obj));
    }

    switch (true) {
      case interaction.options.getSubcommand() === "realtime": {
        data = await Melon(new Date().getTime().toString(), {
          cutLine: 10,
        }).realtime();
        break;
      }
      case interaction.options.getSubcommand() === "daily": {
        data = await Melon(new Date().getTime().toString(), {
          cutLine: 10,
        }).daily();
        break;
      }
    }

    const embed = await this.getChartEmbed(data, interaction.locale);
    await interaction.editReply({ embeds: [embed] });
  }

  private async getChartEmbed(
    { data, dates }: MelonChart,
    locale: Locale
  ): Promise<ExtendedEmbed> {
    const embed = new ExtendedEmbed();

    if (data.length === 0) {
      embed.setDescription(format(locale, "MELON_DATA_NOT_EXISTS"));
      return embed;
    }
    await embed.setThumbnailAndColor(
      (data.at(0) as MelonChartTrackInfo).albumCover
    );
    embed.setTitle(
      format(locale, "MELON_CHART_TITLE", melonDateToString(dates, locale))
    );
    const pages = chunkArray(data, PAGE_CHUNK_SIZE);
    pages.map((page, index) => {
      embed.setFooter({ text: `Page ${index + 1} of ${pages.length}` });
      embed.setDescription(
        page
          .map(
            (track) =>
              `#${track.rank} [${track.title}](https://www.melon.com/song/detail.htm?songId=${track.songId}) - ${track.artist}`
          )
          .join("\n")
      );
    });
    return embed;
  }

  validateInput(date: string) {
    // eslint-disable-next-line security/detect-unsafe-regex
    const dateRegex = /^(\d{4})\/?(\d{2})\/?(\d{2})?$/;
    // eslint-disable-next-line security/detect-unsafe-regex
    const yearMonthRegex = /^(\d{4})\/?(\d{2})?$/;
    // eslint-disable-next-line security/detect-unsafe-regex
    const monthDayRegex = /^(\d{2})\/?(\d{2})?$/;
    const dayRegex = /^(\d{2})$/;

    if (dateRegex.test(date)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [_, year, month, day] = date.match(dateRegex)!;
      return { year, month, day };
    } else if (yearMonthRegex.test(date)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [_, year, month] = date.match(yearMonthRegex)!;
      return { year, month };
    } else if (monthDayRegex.test(date)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [_, month, day] = date.match(monthDayRegex)!;
      return { month, day };
    } else if (dayRegex.test(date)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [_, day] = date.match(dayRegex)!;
      return { day };
    } else {
      return null;
    }
  }
}
