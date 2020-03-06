const JagTagParser = require('@thesharks/jagtag-js')
const template = require('string-placeholder')
const Discord = require('discord.js')
class Event {
  constructor (client) {
    this.client = client
  }

  /**
   * Run Event
   * @param member {Object} - GuildMember
   */
  async run (member) {
    this.client.logger.debug(`[GuildMemberAdd] Check Guild Member, Check Guild ${member.guild.id}`)
    await this.client.database.checkGuild(member.guild.id)
    await this.client.database.checkMember(member.id, member.guild.id)
    await this.client.database.checkUser(member.id)
    const guildData = await this.client.database.getGuild(member.guild.id)
    const guild = member.guild
    if ((guildData.welcome.text || guildData.welcome.image) && guildData.welcomeChannel !== '0') {
      const welcomeChannel = member.guild.channels.cache.get(guildData.welcomeChannel)
      if (!welcomeChannel) return
      if (!this.client.utils.permissionChecker.checkChannelPermission(guild.me, welcomeChannel, ['SEND_MESSSAGES', 'ATTACH_FILES'])) return
      if (guildData.welcome.text && !guildData.welcome.image) return welcomeChannel.send(this.template(guildData, member, guild))
      const params = [guild, member.user, guildData.welcome.image.text]
      if (guildData.welcome.image.bgURL) params.push(guildData.welcome.image.bgURL)
      if (guildData.welcome.image.style) params.push(guildData.welcome.image.style)
      const imageCanvas = await this.client.utils.image.resolveInfo(this.client.utils.image.models.welcome(...params))
      const attachment = new Discord.MessageAttachment(imageCanvas.toBuffer(), 'card.png')
      if (guildData.welcome.text && guildData.welcome.image) return welcomeChannel.send(this.template(guildData, member, guild), attachment)
      if (!guildData.welcome.text && guildData.welcome.image) return welcomeChannel.send(attachment)
    }
  }

  template (guildData, member, guild) {
    const templateResult = template(guildData.welcomeMessage, { user: member.user, tag: member.user.tag, channels: guild.channels.cache.size, roles: guild.roles.cache.size, users: guild.memberCount }, { before: '{', after: '}' })
    return JagTagParser(templateResult)
  }
}
module.exports = Event

module.exports.info = {
  event: 'guildMemberAdd'
}
