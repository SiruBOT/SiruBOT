const { BaseEvent } = require('../structures')

class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'guildDelete',
      (...args) => this.run(...args)
    )
  }

  async run (guild) {
    this.client.logger.info(`[GuildDelete] Clear Audio, ${guild.id}`)
    this.client.audio.stop(guild.id, true)
  }
}
module.exports = Event
