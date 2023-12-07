import {
  AutocompleteInteraction,
  CacheType,
  SlashCommandBuilder,
} from "discord.js";

import { ILyricsSearchResult, MelonProvider } from "slyrics";

import { BaseCommand, KafuuClient } from "@/structures";
import {
  KafuuCommandCategory,
  KafuuCommandContext,
  KafuuCommandFlags,
  KafuuCommandPermission,
} from "@/types/command";
import { EmbedFactory } from "@/utils/embed";
import { AUTOCOMPLETE_MAX_RESULT } from "@/constants/message";
import { format } from "@/locales";

export default class LyricsCommand extends BaseCommand {
  constructor(client: KafuuClient) {
    const slashCommand = new SlashCommandBuilder()
      .setName("lyrics")
      .setNameLocalizations({
        ko: "가사",
      })
      .setDescription("Search lyrics from query")
      .setDescriptionLocalizations({
        ko: "검색어에서 노래 가사를 찾아드려요!",
      })
      .addStringOption((option) => {
        return option
          .setName("query")
          .setNameLocalizations({
            ko: "검색어",
          })
          .setDescription("Query to search")
          .setDescriptionLocalizations({
            ko: "검색할 노래의 이름을 입력해주세요, 검색어에 아티스트명이 포함되어 있다면 정확도가 높아져요.",
          })
          .setAutocomplete(true)
          .setRequired(true);
      });
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
    if (!interaction.isChatInputCommand()) return;
    const query: string = interaction.options.getString("query", true);
    const provider: MelonProvider = new MelonProvider();
    const searchResult: ILyricsSearchResult = await provider.search(query);
    if (searchResult.entries.length <= 0) {
      await interaction.editReply(
        format(interaction.locale, "LYRICS_NOT_FOUND")
      );
      return;
    }
    const resultEmbed = EmbedFactory.createEmbed();
    const lyrics = await searchResult.entries[0].getLyrics();
    resultEmbed.setTitle(`${lyrics.title}`);
    resultEmbed.setFooter({ text: lyrics.artist });
    if (lyrics.albumCover && typeof lyrics.albumCover === "string")
      await resultEmbed.setThumbnailAndColor(lyrics.albumCover as string);
    // 결과 텍스트
    let resultText =
      lyrics.lyrics ??
      format(
        interaction.locale,
        "LYRICS_NAN",
        lyrics.artist + "-" + lyrics.title
      );

    // 가사가 길다면 링크로 대체
    if (lyrics.lyrics?.length && lyrics.lyrics.length > 2048)
      resultText = format(
        interaction.locale,
        "LYRICS_TOO_LONG",
        lyrics.artist + "-" + lyrics.title,
        lyrics.url
      );
    resultEmbed.setDescription(resultText);
    await interaction.editReply({ embeds: [resultEmbed] });
  }

  // Autocomplete Handler
  public override async onAutocompleteInteraction(
    interaction: AutocompleteInteraction<CacheType>
  ): Promise<void> {
    const query: string | null = interaction.options.getString("query");
    if (!query)
      return await interaction.respond([
        {
          name: format(interaction.locale, "PLAY_AUTOCOMPLETE_NO_QUERY"),
          value: "",
        },
      ]);
    const provider: MelonProvider = new MelonProvider();
    const searchResult: ILyricsSearchResult = await provider.search(query);
    if (searchResult.entries.length > 0 && !interaction.responded) {
      await interaction.respond(
        searchResult.entries
          .map((result) => {
            const name = `${result.artist} - ${result.title}`;
            return {
              name: name.length > 100 ? name.slice(0, 90) + "..." : name,
              value: name.length > 100 ? name.slice(0, 99) : name,
            };
          })
          .slice(0, AUTOCOMPLETE_MAX_RESULT)
      );
    }
  }
}
