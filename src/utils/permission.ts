import { GuildMember, Collection, Role } from "discord.js";
import {
  KafuuCommandPermission,
  KafuuCommandPermissionCheckContext,
  KafuuCommandPermissionCheckOptions,
  KafuuPermissionCheckResult,
} from "@/types/command";

export async function KafuuCommandPermissionCondition(
  ctx: KafuuCommandPermissionCheckContext,
): Promise<boolean> {
  const { ADMIN, BOTOWNER, DJ, EVERYONE } = KafuuCommandPermission;

  switch (ctx.permission) {
    case ADMIN:
      return ctx.guildMember.permissions.has("Administrator");

    case BOTOWNER:
      return ctx.client.settings.bot.owners.includes(ctx.guildMember.id);

    case DJ: {
      const voiceMembers: Collection<string, GuildMember> | undefined =
        ctx.guildMember.voice.channel?.members.filter(
          (member) => !member.user.bot,
        ); // 봇 제외 듣고있는 사람들 collection
      // 듣고있는 사람이 있고, 혼자고 그사람이 ctx.guildMember라면, DJ true
      if (
        voiceMembers != undefined &&
        voiceMembers.size == 1 &&
        voiceMembers.first()?.id === ctx.guildMember.id
      )
        return true;
      // 역할 객체를 가져온다
      const djRole: Role | null = ctx.guildConfig.djRoleId
        ? await ctx.guildMember.guild.roles.fetch(ctx.guildConfig.djRoleId)
        : null; // DB에 역할이 있다면, 역할  fetch, 없으면 null
      if (!djRole) return true; // 역할이 없다면, 모두 DJ권한이 있음
      // 역할이 있다면, 역할이 있는 사람과, 관리자만 DJ권한이 있음
      return (
        ctx.guildMember.permissions.has("Administrator") ||
        ctx.guildMember.roles.cache.has(djRole.id)
      );
    }

    case EVERYONE: // 항상 True
      return true;
  } // Switch-Case 의 끝
}

/**
 *  Check if the user has the required permissions
 */
export async function getUserPermissions(
  options: KafuuCommandPermissionCheckOptions,
): Promise<KafuuPermissionCheckResult> {
  const notFulfilledPermissions: KafuuCommandPermission[] = [];
  const fulfilledPermissions: KafuuCommandPermission[] = [];
  for (const perm of Object.keys(
    KafuuCommandPermission,
  ) as KafuuCommandPermission[]) {
    const checkRes: boolean = await KafuuCommandPermissionCondition({
      ...options,
      permission: perm,
    });
    if (!checkRes) notFulfilledPermissions.push(perm);
    else fulfilledPermissions.push(perm);
  }
  return {
    notFulfilledPermissions,
    fulfilledPermissions,
  };
}
