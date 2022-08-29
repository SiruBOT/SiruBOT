import { Collection, GuildMember } from "discord.js";
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
    return options.guildMember.permissions.has("Administrator");
  },
  // BotOwner
  [CommandPermissions.BOTOWNER]: (options: PermissionFilterOptions) =>
    options.settings.bot.owners.includes(options.guildMember.id),
  // DJ
  [CommandPermissions.DJ]: (options: PermissionFilterOptions): boolean => {
    // TODO: roles Fetch 해서 가져오는 부분이 필요해보임 -> Await/Async 사용해야함
    // TODO:    -> CommandPermissionChecker 를 async/await지원하게 만들고, onInteractionRe어쩌고에서
    // TODO:    -> 이벤트에서 처리할때 await으로 처리해야함
    /**
     * @description 길드 설정에 dj 역할 아이디가 없다면 관리자가 있거나, 혼자 듣고 있다면 DJ권한을 줌, 만약 길드 설정에 dj 역할이 있다면 멤버에 dj역할이 있는지 확인후 없다면 관리자 있는지 여부
     */
    const voiceMembers: Collection<string, GuildMember> | undefined =
      options.guildMember.voice.channel?.members;
    if (!options.guildConfig.djRoleId) {
      return (
        options.guildMember.permissions.has("Administrator") ||
        voiceMembers?.filter((member) => !member.user.bot && !member.voice.deaf)
          ?.size == 1
      );
    } else {
      return (
        options.guildMember.roles.cache.has(options.guildConfig.djRoleId) ||
        options.guildMember.permissions.has("Administrator")
      );
    }
  },
  // Default Permission
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [CommandPermissions.EVERYONE]: () => true,
};

export class CommandPermissionChecker {
  public static getPermissions(
    permissionFilterOptions: PermissionFilterOptions
  ): CommandPermissions[] {
    return Object.values(CommandPermissions).filter((permission) =>
      // eslint-disable-next-line security/detect-object-injection
      CommandPermissionsFilters[permission](permissionFilterOptions)
    );
  }
}
