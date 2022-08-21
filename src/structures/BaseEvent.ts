import { type ClientEvents } from "discord.js";
import type { Client } from ".";

export abstract class BaseEvent<T extends keyof ClientEvents> {
  public client: Client;
  public name: T;

  constructor(client: Client, name: T) {
    this.client = client;
    this.name = name;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(...args: ClientEvents[T]): Promise<void> {
    throw new Error("Method not implemented. BaseEvent#run");
  }
}
