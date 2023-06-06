import { Guild } from "discord.js";
import { BaseEvent, KafuuClient } from "@/structures";

export default class GuildUnavailableEvent extends BaseEvent<"guildUnavailable"> {
  constructor(client: KafuuClient) {
    super(client, "guildUnavailable");
  }

  public override async run(guild: Guild): Promise<void> {
    this.client.log.warn(
      `Guild @ ${guild.id} has been unavaliable. if dispatcher exists, stopping..`
    );
    this.client.audio.dispatchers.get(guild.id)?.destroy();
  }
}
