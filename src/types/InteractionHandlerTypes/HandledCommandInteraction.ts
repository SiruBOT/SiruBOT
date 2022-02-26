import { CommandInteraction, type GuildMember } from "discord.js";
import type { ICommandRequirements } from "..";
import { VoiceConnectedGuildMember } from "./VoiceConnectedGuildMember";

type VoiceConnectedType = "voiceConnected";
type VoiceNotConnectedType = "voiceNotConnected";

export class HandledCommandInteraction<
  T extends VoiceConnectedType | VoiceNotConnectedType = VoiceNotConnectedType
> extends CommandInteraction<"cached"> {
  public member: T extends VoiceConnectedType
    ? VoiceConnectedGuildMember
    : GuildMember;
}
