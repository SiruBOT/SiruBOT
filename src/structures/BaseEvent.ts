import * as Discord from "discord.js";
export class BaseEvent {
  client: Discord.Client;
  name: string;

  constructor(client: Discord.Client, name: string) {
    this.client = client;
    this.name = name;
  }

  /**
   * @description - Function on this event emitted
   * @returns {Promise<*>} - Returns Any Values (includes void)
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async run(): Promise<void> {}
}
