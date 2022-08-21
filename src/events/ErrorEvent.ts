import { BaseEvent, Client } from "../structures";

const eventName = "error" as const;
export default class ErrorEvent extends BaseEvent<typeof eventName> {
  constructor(client: Client) {
    super(client, eventName);
  }

  async run(error: Error): Promise<void> {
    throw new Error("NotImpl");
  }
}
