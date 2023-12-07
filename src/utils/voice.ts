import { GuildMember, VoiceBasedChannel } from "discord.js";
import { Collection } from "discord.js";

export function getListeningMembers(
  voiceChannel: VoiceBasedChannel,
): Collection<string, GuildMember> {
  return voiceChannel.members.filter(
    (member) => !member.user.bot && !member.voice.deaf,
  );
}
