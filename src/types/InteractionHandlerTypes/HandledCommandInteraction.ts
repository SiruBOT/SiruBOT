import { CommandInteraction, type GuildMember } from "discord.js";
import { ICommandRequirements } from "../CommandTypes/ICommandRequirements";
import { VoiceConnectedGuildMember } from "./VoiceConnectedGuildMember";

export class HandledCommandInteraction<
  T extends ICommandRequirements = ICommandRequirements
> extends CommandInteraction<"cached"> {
  public member: T["voiceStatus"]["voiceConnected"] extends true
    ? VoiceConnectedGuildMember
    : GuildMember;
}

// export class HandledCommandInteraction<
//   T extends boolean = false
// > extends CommandInteraction<"cached"> {
//   public member: T extends VoiceConnectedType
//     ? VoiceConnectedGuildMember
//     : GuildMember;
// }
