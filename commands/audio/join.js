class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'join',
      aliases: ['ㅓㅐㅑㅜ'],
      permissions: ['DJ', 'Administrator']
    }
  }

  getRightTextChannel (channel, id) {
    if (id === channel.id) return true
    if (id === '0') return true
    if (this.client.channels.get(id)) {
      if (this.client.channels.get(id).id === channel.id) return true
      else return false
    } else {
      return true
    }
  }

  async run (compressed, silent = false) {
    const { message } = compressed
    const Audio = this.client.audio
    const vch = compressed.GuildData.vch
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker

    if (message.member.voiceChannel) {
      if (this.getRightTextChannel(message.member.voiceChannel, vch)) {
        const voiceChannel = message.member.voiceChannel
        const result = await Audio.join({ guild: message.guild.id, channel: voiceChannel, textChannel: message.channel })
        if (result === true) return sendSilent(picker.get(locale, 'COMMANDS_AUDIO_JOIN_OK', { VOICECHANNEL: voiceChannel.id }))
        else return sendSilent(picker.get(locale, 'COMMANDS_AUDIO_JOIN_FAIL', { VOICECHANNEL: voiceChannel.id }))
      } else {
        sendSilent(picker.get(locale, 'AUDIO_NOT_DEFAULT_CH', { VOICECHANNEL: vch }))
      }
    } else {
      sendSilent(picker.get(locale, 'AUDIO_JOIN_VOICE_FIRST'))
    }

    function sendSilent (item) {
      if (!silent) {
        return message.channel.send(item)
      }
    }
  }
}

module.exports = Command
