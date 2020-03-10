class Event {
  constructor (client) {
    this.client = client
  }

  /**
   * Run Event
   */
  run () {
    this.client.logger.info(`[BOT] Bot Is Ready. (${this.client.user.tag})`)
    if (this.client.shard.ids[0] === 0) this.client.setActivity()
    this.client.initialized = true
  }
}
module.exports = Event

module.exports.info = {
  event: 'shardReady'
}
