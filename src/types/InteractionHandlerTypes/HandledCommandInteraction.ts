import { ChatInputCommandInteraction, type GuildMember } from "discord.js";
import { VoiceConnectedGuildMember } from "./VoiceConnectedGuildMember";

export class HandledCommandInteraction<
  VoiceConnected extends boolean
> extends ChatInputCommandInteraction<"cached"> {
  public override member: VoiceConnected extends true
    ? VoiceConnectedGuildMember
    : GuildMember;
}
