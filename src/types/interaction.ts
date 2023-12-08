// Importing necessary modules and types
import { ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { VoiceConnectedGuildMember } from "@/types/member";

// Defining a class that extends ChatInputCommandInteraction
// and takes a generic type parameter 'VoiceConnected'
export class HandledCommandInteraction<
  VoiceConnected extends boolean,
> extends ChatInputCommandInteraction<"cached"> {
  // Overriding the 'member' property of the base class
  // based on the generic type parameter 'VoiceConnected'
  public declare member: VoiceConnected extends true
    ? VoiceConnectedGuildMember // If 'VoiceConnected' is true, use 'VoiceConnectedGuildMember' type
    : GuildMember; // Otherwise, use 'GuildMember' type
}
