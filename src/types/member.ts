// Import necessary types from discord.js library
import type {
  GuildMember,
  Snowflake,
  VoiceBasedChannel,
  VoiceState,
} from "discord.js";

// Define a new interface that extends the VoiceState interface from discord.js
// Omit the 'channel' and 'channelId' properties from the VoiceState interface
export interface VoiceConnectedGuildMemberVoiceState
  extends Omit<VoiceState, "channel" | "channelId"> {
  readonly channel: VoiceBasedChannel; // Add a 'channel' property of type VoiceBasedChannel
  channelId: Snowflake; // Add a 'channelId' property of type Snowflake
}

// Define a new interface that extends the GuildMember interface from discord.js
export interface VoiceConnectedGuildMember extends GuildMember {
  readonly voice: VoiceConnectedGuildMemberVoiceState; // Add a 'voice' property of type VoiceConnectedGuildMemberVoiceState
}
