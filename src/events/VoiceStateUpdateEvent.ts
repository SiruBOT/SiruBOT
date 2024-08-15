import { VoiceState } from "discord.js";
import { BaseEvent, KafuuClient } from "../structures";
// import { PlayerDispatcher } from "../structures/audio/PlayerDispatcher";
// import * as Sentry from "@sentry/node";

const eventName = "voiceStateUpdate" as const;
export default class VoiceStateUpdateEvent extends BaseEvent<typeof eventName> {
  constructor(client: KafuuClient) {
    super(client, eventName);
  }

  public override async run(oldState: VoiceState): Promise<void> {
    if (oldState.member?.id !== this.client.user?.id) return;
    if (!oldState.channelId) return;
  }
}
