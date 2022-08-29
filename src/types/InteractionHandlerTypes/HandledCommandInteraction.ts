import { ChatInputCommandInteraction, type GuildMember } from "discord.js";
import { ICommandRequirements } from "../CommandTypes/ICommandRequirements";
import { VoiceConnectedGuildMember } from "./VoiceConnectedGuildMember";

export class HandledCommandInteraction<
  T extends ICommandRequirements = ICommandRequirements
> extends ChatInputCommandInteraction<"cached"> {
  public override member: T["voiceStatus"]["voiceConnected"] extends true
    ? VoiceConnectedGuildMember
    : GuildMember;
}
