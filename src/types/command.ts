import type { KafuuClient } from "@/structures";
import type { TypeORMGuild } from "@/models/typeorm";
import type { GuildMember } from "discord.js";
import type { HandledCommandInteraction } from "@/types/interaction";
// Enum for command categories
export enum KafuuCommandCategory {
  GENERAL = "General",
  MUSIC = "Music",
  UTILITY = "Utility",
  ADMIN = "Admin",
}

// Enum for command permissions
export enum KafuuCommandPermission {
  BOTOWNER = "BOTOWNER",
  ADMIN = "ADMIN",
  DJ = "DJ",
  EVERYONE = "EVERYONE",
}

// Enum for command flags
export enum KafuuCommandFlags {
  NOTHING = 1 << 0,
  AUDIO_NODE = 1 << 1,
  TRACK_PLAYING = 1 << 2,
  VOICE_CONNECTED = 1 << 3,
  VOICE_SAME_CHANNEL = 1 << 4,
  LISTEN_STATUS = 1 << 5,
}

// Interface for command context
export interface KafuuCommandContext<VoiceConnected extends boolean = false> {
  interaction: HandledCommandInteraction<VoiceConnected>;
  userPermissions: KafuuCommandPermission[]; // Array of user permissions
}

export type KafuuCommandPermissionCheckOptions = Omit<
  KafuuCommandPermissionCheckContext,
  "permission"
>;

// Type for command permission filter context
export type KafuuCommandPermissionCheckContext = {
  guildMember: GuildMember; // Guild member object
  guildConfig: TypeORMGuild; // Guild configuration object
  client: KafuuClient; // Discord.js client object
  permission: KafuuCommandPermission; // Command permission
};

// Interface for permission check result
export interface KafuuPermissionCheckResult {
  notFulfilledPermissions: KafuuCommandPermission[]; // Array of not fulfilled permissions
  fulfilledPermissions: KafuuCommandPermission[]; // Array of fulfilled permissions
}
