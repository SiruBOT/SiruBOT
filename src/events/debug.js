const { BaseEvent } = require('../structures')

class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'debug',
      (...args) => this.run(...args)
    )
  }

  /**
   * Run Event
   * @param {String} message - Debug Message of Client
   */
  async run (message) {
    this.client.logger.debug(message)
    if (message.includes('Heartbeat acknowledged')) {
      await this.client.database.insertPingMetrics(+message.split('latency of ').slice(-1).shift().match(/[0-9]+/).shift(), this.client.shard ? this.client.shard.ids[0] : 1)
    }
  }
}
module.exports = Event
