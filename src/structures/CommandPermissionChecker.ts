import { GuildMember } from "discord.js";
import { Guild } from "../database/mysql/entities";
import { CommandPermissions, ISettings } from "../types";

export interface PermissionFilterOptions {
  guildMember: GuildMember;
  guildConfig: Guild;
  settings: ISettings;
}

const CommandPermissionsFilters: {
  [index: string]: (options: PermissionFilterOptions) => boolean;
} = {
  // Admin
  [CommandPermissions.ADMIN]: (options: PermissionFilterOptions): boolean => {
    return options.guildMember.permissions.has("ADMINISTRATOR");
  },
  // BotOwner
  [CommandPermissions.BOTOWNER]: (options: PermissionFilterOptions) =>
    options.settings.bot.owners.includes(options.guildMember.id),
  // DJ
  [CommandPermissions.DJ]: (options: PermissionFilterOptions): boolean => {
    if (!options.guildConfig.djRoleId) return true;
    return options.guildMember.roles.cache.has(options.guildConfig.djRoleId);
  },
  // Default Permission
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [CommandPermissions.EVERYONE]: (options?: PermissionFilterOptions) => true,
};

export class CommandPermissionChecker {
  public static getPermissions(
    permissionFilterOptions: PermissionFilterOptions
  ): CommandPermissions[] {
    return Object.values(CommandPermissions).filter((permission) =>
      CommandPermissionsFilters[permission](permissionFilterOptions)
    );
  }
}
