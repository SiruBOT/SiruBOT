// Importing necessary types from discord.js and our custom KafuuClient
import { type ClientEvents } from "discord.js";
import type { KafuuClient } from ".";

// Creating an abstract class for all events to extend from
export abstract class BaseEvent<T extends keyof ClientEvents> {
  // Declaring properties for client and event name
  public client: KafuuClient;
  public name: T;

  // Constructor to initialize client and event name
  constructor(client: KafuuClient, name: T) {
    this.client = client;
    this.name = name;
  }

  // Abstract method to be implemented by all events
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(...args: ClientEvents[T]): Promise<void> {
    throw new Error("Method not implemented. BaseEvent#run");
  }
}
