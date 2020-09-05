const { BaseEvent } = require('../structures')

class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'rateLimit',
      (...args) => this.run(...args)
    )
  }

  async run (rateLimitInfo) {
    this.client.logger.warn(`[RateLimit] Encountered 429 on route ${rateLimitInfo.method} ${rateLimitInfo.path} Timeout: ${rateLimitInfo.timeout}, Limit: ${rateLimitInfo.limit}`)
  }
}
module.exports = Event
