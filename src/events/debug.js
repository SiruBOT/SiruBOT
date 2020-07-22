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
  }
}
module.exports = Event
