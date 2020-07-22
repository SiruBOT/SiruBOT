const { BaseEvent } = require('../structures')

class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'guildMemberRemove',
      (...args) => this.run(...args)
    )
  }

  /**
   * Run Event
   * @param {Object} member - GuildMember
   */
  async run (member) {
    this.client.logger.debug(`[GuildMemberRemove] Send Bye Message ${member.guild.id}, ${member.id}`)
    await this.client.events.get('guildMemberAdd').sendWelcome('bye', member)
  }
}
module.exports = Event
