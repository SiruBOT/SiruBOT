class Event {
  constructor (client) {
    this.client = client
    this.name = 'guildMemberRemove'
    this.listener = (...args) => this.run(...args)
  }

  /**
   * Run Event
   * @param member {Object} - GuildMember
   */
  async run (member) {
    this.client.logger.debug(`[GuildMemberRemove] Send Bye Message ${member.guild.id}, ${member.id}`)
    await this.client.events.get('guildMemberAdd').sendWelcome('bye', member)
  }
}
module.exports = Event
