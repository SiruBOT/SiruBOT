class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'stop',
      aliases: ['ㄴ새ㅔ', '정지'],
      permissions: ['DJ', 'Administrator']
    }
  }

  async run (compressed) {
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker
    const { message } = compressed
    const Audio = this.client.audio
    if (!Audio.players.get(message.guild.id)) return message.channel.send(picker.get(locale, 'AUDIO_NOPLAYER'))
    Audio.players.get(message.guild.id).stop(true)
    message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_STOP_OK'))
  }
}

module.exports = Command
