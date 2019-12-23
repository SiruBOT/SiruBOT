const EventEmitter = require('events').EventEmitter
class ServerLoggingManager extends EventEmitter {
  constructor (client) {
    super()
    this.client = client
  }
}

module.exports = ServerLoggingManager
