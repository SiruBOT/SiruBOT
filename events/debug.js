class Event {
  constructor (client) {
    this.client = client
  }

  /**
   * Run Event
   * @param message {String} - Debug Message of Client
   */
  run (message) {
    this.client.logger.debug(message)
  }
}
module.exports = Event

module.exports.info = {
  event: 'debug'
}
