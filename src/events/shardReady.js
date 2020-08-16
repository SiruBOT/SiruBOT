const { BaseEvent } = require('../structures')

class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'shardReady',
      (...args) => this.run(...args)
    )
  }

  /**
   * Run Event
   */
  async run () {
    this.client.logger.info(`[BOT] Bot Is Ready. (${this.client.user.tag})`)
    this.client.setActivity()
    this.client.initialized = true
  }
}
module.exports = Event
