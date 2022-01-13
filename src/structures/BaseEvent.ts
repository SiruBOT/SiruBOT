import type { Client } from ".";
export class BaseEvent {
  client: Client;
  name: string;

  constructor(client: Client, name: string) {
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
