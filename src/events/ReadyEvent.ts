import { BaseEvent, Client } from "../structures";
export default class ReadyEvent extends BaseEvent {
  constructor(client: Client) {
    super(client, "ready");
  }

  async run(): Promise<void> {
    this.client.log.debug("Client ready, set activity.");
    this.client.user?.setStatus("online");
    this.client.user?.setActivity({
      type: this.client.settings.bot.activity.type ?? "PLAYING",
      url: this.client.settings.bot.activity.url,
      name: this.client.settings.bot.playing,
    });
  }
}
