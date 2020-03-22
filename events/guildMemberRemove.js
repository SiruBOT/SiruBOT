class Event {
  constructor (client) {
    this.client = client
  }

  /**
   * Run Event
   * @param member {Object} - GuildMember
   */
  async run (member) {
    this.client.logger.debug(`[GuildMemberRemove] Send Bye Message ${member.guild.id}, ${member.id}`)
    await this.client.events.get('guildMemberAdd').event.sendWelcome('bye', member)
  }
}
module.exports = Event

module.exports.info = {
  event: 'guildMemberRemove'
}
