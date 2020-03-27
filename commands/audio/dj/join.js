class Command {
  constructor (client) {
    this.client = client
    this.name = 'join'
    this.aliases = ['접속', 'ㅓㅐㅑㅜ', 'j']
    this.category = 'MUSIC_DJ'
    this.requirements = {
      audioNodes: true,
      playingStatus: false,
      voiceStatus: {
        listenStatus: true,
        sameChannel: false,
        voiceIn: true
      }
    }
    this.hide = false
    this.permissions = ['DJ', 'Administrator']
  }

  /**
   * @param {Object} compressed - Compressed Object
   * @param {Boolean} silent - if Send Message
   */
  async run (compressed, silent = false) {
    const { message } = compressed
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker
    const voiceChannelID = message.member.voice.channelID

    const loadMessage = silent === true ? '' : await message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_JOIN_LOAD', { VOICECHANNEL: voiceChannelID }))

    const sendFunc = (sendContent, err) => {
      if ((loadMessage.editable && silent === false)) loadMessage.edit(sendContent)
      else if (err && (err !== 'A Player is already established in this channel')) message.channel.send(sendContent)
    }
    if (message.member.voice.channelID && !message.member.voice.channel.joinable && !message.member.voice.channel.speakable) {
      sendFunc(picker.get(locale, 'AUDIO_NOT_JOINABLE_OR_SPEAKABLE'), true)
      return false
    }
    return (() => {
      if (!message.guild.me.voice.channelID || !this.client.audio.players.get(message.guild.id)) {
        return this.client.audio.join(voiceChannelID, message.guild.id)
      } else if (this.client.audio.players.get(message.guild.id).voiceConnection.voiceChannelID !== message.member.voice.channelID) {
        return this.client.audio.moveChannel(voiceChannelID, message.guild.id)
      } else {
        return Promise.resolve(true)
      }
    })().then(() => {
      sendFunc(picker.get(locale, 'COMMANDS_AUDIO_JOIN_OK', { VOICECHANNEL: voiceChannelID }))
      return true
    }).catch((e) => {
      if (e.message === 'A Player is already established in this channel') sendFunc(picker.get(locale, 'COMMANDS_AUDIO_JOIN_DUPLICATED', { VOICECHANNEL: voiceChannelID }))
      else sendFunc(picker.get(locale, 'COMMANDS_AUDIO_JOIN_FAIL', { VOICECHANNEL: voiceChannelID }) + `\`\`\`js\n > ${`${e.name}: ${e.message}`.split('\n').join('\n> ')}\`\`\``, e)
      return e.message === 'A Player is already established in this channel' ? true : e.message
    })
  }
}

module.exports = Command
