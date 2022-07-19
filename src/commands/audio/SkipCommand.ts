import { SlashCommandBuilder } from "@discordjs/builders";
import { Collection, GuildMember } from "discord.js";
import { BaseCommand, Client } from "../../structures";
import { PlayerDispatcher } from "../../structures/audio/PlayerDispatcher";
import {
  CommandCategories,
  CommandPermissions,
  IAudioTrack,
  ICommandContext,
  ICommandRequirements,
  IGuildAudioData,
} from "../../types";
import locale from "../../locales";
import { EmbedFactory } from "../../utils/EmbedFactory";
export default class VolumeCommand extends BaseCommand {
  constructor(client: Client) {
    const slashCommand = new SlashCommandBuilder()
      .setName("skip")
      .setDescription("노래를 건너뛸 수 있어요")
      .addBooleanOption((option) => {
        return option
          .setName("forceskip")
          .setDescription("강제로 건너뛰기")
          .setRequired(false);
      })
      .addIntegerOption((input) => {
        return input
          .setName("to")
          .setDescription("대기열의 특정 노래로 건너뛰기")
          .setRequired(false);
      });
    super(
      slashCommand,
      client,
      CommandCategories.MUSIC,
      [CommandPermissions.EVERYONE],
      {
        audioNode: true,
        trackPlaying: true,
        voiceStatus: {
          listenStatus: true,
          sameChannel: true,
          voiceConnected: true,
        },
      },
      ["SendMessages"]
    );
  }

  public async onCommandInteraction({
    interaction,
  }: ICommandContext<ICommandRequirements>): Promise<void> {
    const forceSkip: boolean | null =
      interaction.options.getBoolean("forceskip");
    const skipTo: number | null = interaction.options.getInteger("to");
    const voiceMembers: Collection<string, GuildMember> | undefined =
      interaction.member.voice.channel?.members;
    if (voiceMembers) {
      // Filter voice members without bot and deafened users
      const actualListenMembers: Collection<string, GuildMember> =
        voiceMembers.filter(
          (member) => member.id !== this.client.user?.id && !member.voice.deaf
        );
      const dispatcher: PlayerDispatcher =
        this.client.audio.getPlayerDispatcher(interaction.guildId);
      const { queue }: IGuildAudioData =
        await dispatcher.queue.getGuildAudioData();
      const nextTrack: IAudioTrack | undefined = queue.at(0);
      if (nextTrack) {
        // Listen alone
        if (actualListenMembers.size === 1) {
          await dispatcher.skipTrack();
          await interaction.reply({
            content: locale.format(interaction.locale, "SKIPPED_TRACK"),
            embeds: [
              await EmbedFactory.getTrackEmbed(
                this.client,
                locale.getReusableFormatFunction(interaction.locale),
                nextTrack
              ),
            ],
          });
        } else {
          // VoteSkip
          // TODO: Implement voteskip
        }
      } else {
        await dispatcher.cleanStop();
        await interaction.reply({
          content: locale.format(interaction.locale, "SKIP_NO_NEXT_STOPPED"),
        });
      }
    }
  }
}
