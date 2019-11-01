class Event {
  constructor (client) {
    this.client = client
  }

  run (member) {
    this.client.logger.debug(`[GuildMemberAdd] Check Guild Member, Check Guild ${member.guild.id}`)
    this.client.database.checkGuild(member.guild)
    this.client.database.checkGuildMember(member)
    this.client.database.checkGlobalMember(member)
  }
}
module.exports = Event

module.exports.info = {
  event: 'guildMemberAdd'
}
