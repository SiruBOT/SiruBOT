import { CommandPermissions } from "../../types";

export class CommandPermissionError extends Error {
  permission: CommandPermissions;
  constructor(permission: CommandPermissions) {
    super();
    this.name = "CommandPermissionError";
    this.message =
      "You don't have permission to use this command (required: " +
      permission +
      ")";
    this.permission = permission;
  }
}
