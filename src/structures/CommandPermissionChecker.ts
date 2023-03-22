import { GuildMember } from "discord.js";
import { Client } from "./Client";
import { Guild } from "../database/mysql/entities";
import { CommandPermissions } from "../types/CommandTypes/CommandPermissions";
import { CommandPermissionConditions } from "../types/CommandTypes/CommandPermissionConditions";

export interface PermissionCheckOptions {
  permissionsCheckTo: CommandPermissions[];
  guildMember: GuildMember;
  guildConfig: Guild;
}

export type PermissionFilterContext = PermissionCheckOptions & {
  client: Client;
  permission: CommandPermissions;
};

export interface PermissionCheckResult {
  success: boolean;
  notFulfilledPermissions: CommandPermissions[];
}

export class CommandPermissionChecker {
  private client: Client;
  constructor(client: Client) {
    this.client = client;
  }

  /**
   *  Check if the user has the required permissions
   * @param {PermissionCheckOptions} options
   * @returns {Promise<PermissionCheckResult>}
   */
  public async check(
    options: PermissionCheckOptions
  ): Promise<PermissionCheckResult> {
    const notFulfilledPermissions: CommandPermissions[] = [];
    for (const perm of options.permissionsCheckTo) {
      const checkRes: boolean = await CommandPermissionConditions({
        ...options,
        permission: perm,
        client: this.client,
      });
      if (!checkRes) notFulfilledPermissions.push(perm);
    }
    return {
      success: notFulfilledPermissions.length == 0,
      notFulfilledPermissions,
    };
  }
}
