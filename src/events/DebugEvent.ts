import { BaseEvent, Client } from "../structures";
export default class DebugEvent extends BaseEvent {
  constructor(client: Client) {
    super(client, "debug");
  }

  async run(debugMessage: string): Promise<void> {
    if (this.client.bootStrapperArgs.debug) this.client.log.debug(debugMessage);
  }
}
