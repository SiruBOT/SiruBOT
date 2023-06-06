import * as Sentry from "@sentry/node";
import { BaseEvent, KafuuClient } from "../structures";

const eventName = "error" as const;
export default class ErrorEvent extends BaseEvent<typeof eventName> {
  constructor(client: KafuuClient) {
    super(client, eventName);
  }

  public override async run(error: Error): Promise<void> {
    this.client.log.prettyError(error);
    if (this.client.settings.sentryDsn) Sentry.captureException(error);
  }
}
