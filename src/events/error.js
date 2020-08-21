const { BaseEvent } = require('../structures')
const Sentry = require('@sentry/node')
class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'error',
      (...args) => this.run(...args)
    )
  }

  async run (error) {
    const sentryEventId = Sentry.captureException(error)
    this.client.logger.error(`[Client Error, Sentry Id: ${sentryEventId}] ${error.stack}`)
  }
}
module.exports = Event
