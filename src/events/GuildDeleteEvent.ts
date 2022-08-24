import { Guild } from "discord.js";
import { BaseEvent, Client } from "../structures";
const eventName = "guildDelete" as const;
export default class GuildDeleteEvent extends BaseEvent<typeof eventName> {
  constructor(client: Client) {
    super(client, eventName);
  }

  public override async run(guild: Guild): Promise<void> {
    this.client.log.debug(`Guild deleted. Clear audio @ ${guild.id}`);
    if (this.client.audio.hasPlayerDispatcher(guild.id)) {
      this.client.audio.getPlayerDispatcher(guild.id).destroy();
    }
  }
}
