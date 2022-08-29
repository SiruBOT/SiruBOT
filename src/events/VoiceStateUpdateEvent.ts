import { VoiceState } from "discord.js";
import { BaseEvent, Client } from "../structures";
// import { PlayerDispatcher } from "../structures/audio/PlayerDispatcher";
// import * as Sentry from "@sentry/node";

const eventName = "voiceStateUpdate" as const;
export default class VoiceStateUpdateEvent extends BaseEvent<typeof eventName> {
  constructor(client: Client) {
    super(client, eventName);
  }

  public override async run(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    if (oldState.member?.id !== this.client.user?.id) return;
    if (!oldState.channelId) return;
    // if (oldState.channelId !== newState.channelId) {
    //   const dispatcher: PlayerDispatcher | undefined =
    //     this.client.audio.dispatchers.get(newState.guild.id);
    //   this.client.log.debug(
    //     `Channel update, ${oldState.channelId} -> ${
    //       newState.channelId ? newState.channelId : "Disconnected."
    //     }`
    //   );
    //   if (!dispatcher) return;
    //   try {
    //     // Handle Disconnect.
    //     if (!newState.channelId) {
    //       dispatcher.destroy();
    //       await dispatcher.sendDisconnected();
    //       return;
    //     }
    //     await dispatcher.player.connection.connect(newState.channelId);
    //   } catch (error) {
    //     Sentry.captureException(error);
    //     dispatcher.destroy();
    //     this.client.log.error(`Failed to reconnect on moved channel`, error);
    //   }
    // }
  }
}
