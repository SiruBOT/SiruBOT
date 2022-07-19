import { ActivityType } from "discord.js";
import { BaseEvent, Client } from "../structures";
export default class ReadyEvent extends BaseEvent {
  constructor(client: Client) {
    super(client, "ready");
  }

  async run(): Promise<void> {
    const ActivityTypeStrMap: {
      [key: string]: Exclude<ActivityType, ActivityType.Custom>;
    } = {
      PLAYING: ActivityType.Playing,
      STREAMING: ActivityType.Streaming,
      LISTENING: ActivityType.Listening,
      WATCHING: ActivityType.Watching,
    };
    this.client.log.debug("Client ready, set activity.");
    // Set status to online
    this.client.user?.setStatus("online");
    this.client.user?.setActivity({
      type: ActivityTypeStrMap[this.client.settings.bot.activity.type],
      url: this.client.settings.bot.activity.url,
      name: this.client.settings.bot.playing,
    });
  }
}
