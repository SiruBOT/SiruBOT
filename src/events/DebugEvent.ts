import { BaseEvent, Client } from "../structures";

const eventName = "debug" as const;
export default class DebugEvent extends BaseEvent<typeof eventName> {
  constructor(client: Client) {
    super(client, eventName);
  }

  async run(debugMessage: string): Promise<void> {
    if (this.client.bootStrapperArgs.debug) this.client.log.debug(debugMessage);
  }
}
