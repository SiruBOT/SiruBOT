import { CommandPermissions, HandledCommandInteraction } from "../";

export interface ICommandContext<VoiceConnected extends boolean = false> {
  interaction: HandledCommandInteraction<VoiceConnected>;
  userPermissions: CommandPermissions[];
}
