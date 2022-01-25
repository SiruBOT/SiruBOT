import { type ClientEvents } from "discord.js";
import type { Client } from ".";
export abstract class BaseEvent {
  public client: Client;
  public name: keyof ClientEvents;

  constructor(client: Client, name: keyof ClientEvents) {
    this.client = client;
    this.name = name;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(...args: ClientEvents[keyof ClientEvents]): Promise<void> {
    throw new Error("Method not implemented. BaseEvent#run");
  }
}
