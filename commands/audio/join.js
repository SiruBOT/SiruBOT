class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'join',
      aliases: ['ㅓㅐㅑㅜ'],
      permissions: ['DJ', 'Administrator']
    }
  }

  async run (compressed, silent = false) {
    const { message } = compressed
    const Audio = this.client.audio
    const vch = compressed.GuildData.vch
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker

    if (!message.member.voiceChannel) return sendSilent(picker.get(locale, 'AUDIO_JOIN_VOICE_FIRST'))
    if (!this.client.getRightTextChannel(message.member.voiceChannel, vch)) return sendSilent(picker.get(locale, 'AUDIO_NOT_DEFAULT_CH', { VOICECHANNEL: vch }))

    const voiceChannel = message.member.voiceChannel
    if (Audio.players.get(message.guild.id) && !message.guild.me.voiceChannel) {
      Audio.players.get(message.guild.id).player.switchChannel('0', true)
      Audio.players.get(message.guild.id).player.switchChannel(voiceChannel.id, true)
      return sendSilent(picker.get(locale, 'COMMANDS_AUDIO_JOIN_OK', { VOICECHANNEL: voiceChannel.id }))
    }
    const result = await Audio.join({ guild: message.guild.id, channel: voiceChannel, textChannel: message.channel })
    if (result === true) return sendSilent(picker.get(locale, 'COMMANDS_AUDIO_JOIN_OK', { VOICECHANNEL: voiceChannel.id }))
    else {
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_JOIN_FAIL', { VOICECHANNEL: voiceChannel.id }))
      return false
    }

    function sendSilent (item) {
      if (!silent) {
        return message.channel.send(item)
      }
    }
  }
}

module.exports = Command
