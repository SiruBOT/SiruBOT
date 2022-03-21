import { CommandPermissions } from "../../types";

export class CommandPermissionError extends Error {
  permissions: CommandPermissions;
  constructor(permissions: CommandPermissions) {
    super();
    this.permissions = permissions;
  }
}
