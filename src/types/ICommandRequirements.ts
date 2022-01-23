import { type PermissionString } from "discord.js";
export interface ICommandRequirements {
  audioNode: boolean;
  trackPlaying: boolean;
  guildPermission: PermissionString;
  voiceStatus: {
    listenStatus: boolean;
    sameChannel: boolean;
    voiceConnected: boolean;
  };
}
