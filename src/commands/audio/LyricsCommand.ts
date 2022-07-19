import { SlashCommandBuilder } from "@discordjs/builders";
import { BaseCommand, Client } from "../../structures";
import {
  CommandCategories,
  CommandPermissions,
  ICommandContext,
} from "../../types";
import { ILyricsSearchResult, MelonProvider } from "slyrics";
import locale from "../../locales";
import { AutocompleteInteraction, CacheType } from "discord.js";
import { EmbedFactory } from "../../utils";
import { AUTOCOMPLETE_MAX_RESULT } from "../../constant/MessageConstant";

export default class LyricsCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("lyrics")
      .setDescription("노래의 가사를 찾아드려요")
      .addStringOption((option) => {
        return option
          .setName("query")
          .setDescription("가사 검색어")
          .setAutocomplete(true)
          .setRequired(true);
      });
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
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
  }: ICommandContext): Promise<void> {
    await interaction.deferReply();
    if (!interaction.isChatInputCommand()) return;
    const query: string = interaction.options.getString("query", true);
    const provider: MelonProvider = new MelonProvider();
    const searchResult: ILyricsSearchResult = await provider.search(query);
    if (searchResult.entries.length <= 0) {
      await interaction.editReply(
        locale.format(interaction.locale, "LYRICS_SEARCH_NOT_FOUND")
      );
      return;
    }
    const resultEmbed = EmbedFactory.createEmbed();
    const lyrics = await searchResult.entries[0].getLyrics();
    resultEmbed.setTitle(`${lyrics.title}`);
    resultEmbed.setFooter({ text: lyrics.artist });
    if (lyrics.albumCover && typeof lyrics.albumCover === "string")
      await resultEmbed.setThumbnailAndColor(lyrics.albumCover as string);
    // if (lyrics.lyrics.length > 1024) {
    //   // Pagenation
    //   resultEmbed.setDescription("Pagenation required (lyrics > 1024)");
    // } else {
    resultEmbed.setDescription(
      lyrics.lyrics ?? locale.format(interaction.locale, "LYRICS_NAN")
    );
    // }
    await interaction.editReply({ embeds: [resultEmbed] });
  }

  // Autocomplete Handler
  public async onAutocompleteInteraction(
    interaction: AutocompleteInteraction<CacheType>
  ): Promise<void> {
    const query: string | null = interaction.options.getString("query");
    if (!query) return;
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
    } else {
      await interaction.respond([]);
    }
  }
}
