class Event {
  constructor (client) {
    this.client = client
  }

  run () {
    this.client.logger.info(`[BOT] Bot Is Ready. (${this.client.user.tag})`)
    this.client.LoadCommands()
    this.client.database.init()
    this.client.ActivityInterVal()
    this.client.audio.init()
    this.client.initialized = true
  }
}
module.exports = Event

module.exports.info = {
  event: 'ready'
}
