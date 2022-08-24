import { Guild } from "discord.js";
import { BaseEvent, Client } from "../structures";
const eventName = "guildUnavailable" as const;
export default class GuildUnavailableEvent extends BaseEvent<typeof eventName> {
  constructor(client: Client) {
    super(client, eventName);
  }

  public override async run(guild: Guild): Promise<void> {
    this.client.log.warn(
      `Guild @ ${guild.id} has been unavaliable. if dispatcher exists, stopping..`
    );
    if (this.client.audio.hasPlayerDispatcher(guild.id)) {
      this.client.audio.getPlayerDispatcher(guild.id).destroy();
    }
  }
}
