import * as Discord from "discord.js";
import * as Sentry from "@sentry/node";
import type { Transaction } from "@sentry/types";
import { Logger } from "tslog";
import { BaseEvent, type Client } from "../structures";

const eventName = "messageCreate" as const;
export default class InteractionCreateEvent extends BaseEvent<
  typeof eventName
> {
  private log: Logger;
  constructor(client: Client) {
    super(client, eventName);
    this.log = client.log.getChildLogger({
      name: client.log.settings.name + "/MessageCreate",
    });
  }

  async run(message: Discord.Message): Promise<void> {
    if (message.content.startsWith(">>")) {
      const transaction: Transaction = Sentry.startTransaction({
        op: "messageCreate",
        name: "Message handler",
      });
      transaction.setData("messageChannelType", message.channel.type);
      transaction.setData("messageInGuild", message.inGuild());
    }
  }
}
