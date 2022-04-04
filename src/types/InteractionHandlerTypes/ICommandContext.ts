import {
  CommandPermissions,
  HandledCommandInteraction,
  ICommandRequirements,
} from "../";

export interface ICommandContext<
  T extends ICommandRequirements = ICommandRequirements
> {
  interaction: HandledCommandInteraction<T>;
  userPermissions: CommandPermissions[];
}
