class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'join',
      aliases: ['ㅓㅐㅑㅜ'],
      category: 'MUSIC_DJ',
      require_voice: false,
      hide: false,
      permissions: ['DJ', 'Administrator']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   * @param {Boolean} silent - if Send Message
   */
  async run (compressed, silent = false) {
    const { message } = compressed
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker
    const voiceChannelID = message.member.voice.channelID

    const loadMessage = silent === true ? '' : await message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_JOIN_LOAD', { VOICECHANNEL: voiceChannelID }))

    const sendFunc = (sendContent, err) => {
      if ((loadMessage.editable && silent === false)) loadMessage.edit(sendContent)
      else if (err && (err !== 'A Player is already established in this channel')) message.channel.send(sendContent)
    }
    return (() => {
      if ((this.client.audio.players.get(message.guild.id) !== undefined) === !message.guild.me.voice.channelID || (this.client.audio.players.get(message.guild.id) === undefined ? false : (this.client.audio.players.get(message.guild.id).voiceConnection.voiceChannelID === null)) || (message.guild.me.voice.channelID === undefined ? false : (message.guild.me.voice.channelID !== message.member.voice.channelID))) {
        return this.client.audio.moveChannel(voiceChannelID, message.guild.id)
      } else {
        return this.client.audio.join(voiceChannelID, message.guild.id)
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
