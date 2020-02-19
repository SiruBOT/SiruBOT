class Event {
  constructor (client) {
    this.client = client
  }

  /**
   * Run Event
   * @param member {Object} - GuildMember
   */
  run (member) {
    this.client.logger.debug(`[GuildMemberAdd] Check Guild Member, Check Guild ${member.guild.id}`)
    this.client.database.checkGuild(member.guild.id)
    this.client.database.checkMember(member.id, member.guild.id)
    this.client.database.checkUser(member.id)
  }
}
module.exports = Event

module.exports.info = {
  event: 'guildMemberAdd'
}
