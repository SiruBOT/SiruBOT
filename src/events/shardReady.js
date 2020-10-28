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
    if (!this.client.shard) {
      this.client.setActivity()
    }
  }
}
module.exports = Event
