import { Guild } from "discord.js";
import { BaseEvent, KafuuClient } from "../structures";
const eventName = "guildDelete" as const;
export default class GuildDeleteEvent extends BaseEvent<typeof eventName> {
  constructor(client: KafuuClient) {
    super(client, eventName);
  }

  public override async run(guild: Guild): Promise<void> {
    this.client.log.debug(`Guild deleted. Clear audio @ ${guild.id}`);
    await this.client.audio.dispatchers.get(guild.id)?.destroy();
  }
}
