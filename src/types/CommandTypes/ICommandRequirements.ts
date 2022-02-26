import { type PermissionString } from "discord.js";
export interface ICommandRequirements {
  audioNode: boolean;
  trackPlaying: boolean;
  guildPermissions: PermissionString[];
  voiceStatus: {
    listenStatus: boolean;
    sameChannel: boolean;
    voiceConnected: boolean;
  };
}
