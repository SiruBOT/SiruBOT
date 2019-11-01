class Event {
  constructor (client) {
    this.client = client
  }

  run (message) {
    this.client.logger.debug(message)
  }
}
module.exports = Event

module.exports.info = {
  event: 'debug'
}
