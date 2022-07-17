import {
  GuildMember,
  Snowflake,
  VoiceBasedChannel,
  VoiceState,
} from "discord.js";

export interface VoiceConnectedGuildMemberVoiceState
  extends Omit<VoiceState, "channel" | "channelId"> {
  readonly channel: VoiceBasedChannel;
  channelId: Snowflake;
}

export interface VoiceConnectedGuildMember extends GuildMember {
  readonly voice: VoiceConnectedGuildMemberVoiceState;
}
