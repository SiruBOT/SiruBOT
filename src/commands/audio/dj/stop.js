const { BaseCommand } = require('../../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'stop',
      ['종료', 'disconnect', 'leave'],
      ['DJ', 'Administrator'],
      'MUSIC_DJ',
      {
        audioNodes: true,
        playingStatus: true,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceIn: false
        }
      },
      false
    )
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
