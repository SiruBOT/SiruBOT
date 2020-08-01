const { BaseEvent } = require('../structures')
const { placeHolderConstant } = require('../constant')
class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'messageReactionAdd',
      (...args) => this.run(...args)
    )
  }

  async run (messageReaction, user) {
    const { message } = messageReaction
    if (message.channel.type === 'dm') return
    if (user.bot) return
    const npMessage = this.client.audio.nowplayingMessages.get(message.guild.id)
    if (npMessage && npMessage.message.id === message.id) {
      const guildData = await this.client.database.getGuild(message.guild.id)
      const userData = await this.client.database.getUser(message.author.id)
      const memberData = await this.client.database.getMember(message.member.id, message.guild.id)
      const member = this.client.guilds.cache.get(message.guild.id).members.cache.get(user.id)
      const userPermissions = this.client.utils.permissionChecker.getUserPerm(member, {
        userData,
        memberData,
        guildData
      })
      const memberVoice = member.voice.channel
      if (memberVoice) {
        const filteredVoice = memberVoice.members.filter(e => !e.user.bot && !(e.voice.serverDeaf || e.voice.selfDeaf))
        if (memberVoice && memberVoice.members && filteredVoice.has(member.id) && filteredVoice.size === 1 && !userPermissions.includes('DJ')) userPermissions.push('DJ')
      }
      if (userPermissions.includes('DJ') && messageReaction.emoji.name === placeHolderConstant.EMOJI_PIN) {
        this.client.audio.utils.toggleNowplayingPinned(message.guild.id)
        await this.client.audio.utils.updateNowplayingMessage(message.guild.id)
        try {
          await messageReaction.users.remove(user)
        } catch {}
      }
    }
  }
}
module.exports = Event
