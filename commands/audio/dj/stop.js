class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'stop',
      aliases: ['종료', 'ㄴ새ㅔ', 'whdfy'],
      category: 'MUSIC_DJ',
      require_voice: false,
      require_nodes: true,
      hide: false,
      permissions: ['DJ', 'Administrator']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker
    const { message } = compressed
    const Audio = this.client.audio
    if (!Audio.players.get(message.guild.id)) return message.channel.send(picker.get(locale, 'AUDIO_NOPLAYER'))
    const interval = setInterval(() => {
      Audio.stop(message.guild.id)
      if (!Audio.players.get(message.guild.id)) {
        clearInterval(interval)
      }
    })
    message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_STOP_OK'))
  }
}

module.exports = Command
