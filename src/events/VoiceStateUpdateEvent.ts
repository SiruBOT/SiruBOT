import { VoiceState } from "discord.js";
import { BaseEvent, KafuuClient } from "../structures";
// import { PlayerDispatcher } from "../structures/audio/PlayerDispatcher";
// import * as Sentry from "@sentry/node";

const eventName = "voiceStateUpdate" as const;
export default class VoiceStateUpdateEvent extends BaseEvent<typeof eventName> {
  constructor(client: KafuuClient) {
    super(client, eventName);
  }

  public override async run(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    if (oldState.member?.user.bot) return;
    // User Leaves Voice Channel
    const player = this.client.audio.dispatchers.get(oldState.guild.id);
    if (
      player &&
      oldState.channelId === player.player.connection.channelId &&
      oldState.channelId != newState.channelId &&
      oldState.channel?.members.filter((e) => !e.user.bot).filter((e) => !e.voice.selfDeaf).size == 0
    ) {
      await this.client.audio.audioTimer.createTimer(oldState.guild.id);
    }

    // User Joins Voice Channel
    if (
      newState.channelId &&
      newState.channelId === player?.player.connection.channelId &&
      oldState.channelId != newState.channelId
    ) {
      this.client.audio.audioTimer.deleteTimer(newState.guild.id);
    }
  }
}
