// const MessageHandler = require('./message')

class Event {
  constructor (client) {
    this.client = client
  }

  /**
   * Run Event
   */
  run (...args) {
    // const message = args[1]
    // const messageEvent = new MessageHandler(this.client)
    // messageEvent.handleCommand(message)
  }
}

module.exports = Event

module.exports.info = {
  event: 'messageUpdate'
}
