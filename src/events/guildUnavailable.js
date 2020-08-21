const { BaseEvent } = require('../structures')

class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'guildUnavailable',
      (...args) => this.run(...args)
    )
  }

  async run (guild) {
    this.client.logger.info(`[guildUnavailable] Clear Audio, ${guild.id}`)
    this.client.audio.stop(guild.id, false)
  }
}
module.exports = Event
