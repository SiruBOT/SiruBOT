const { BaseCommand } = require('../../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'related',
      ['추천', '추천영상', 'ㄱ밈ㅅㄷㅇ'],
      ['DJ', 'Administrator'],
      'MUSIC_DJ',
      {
        audioNodes: false,
        playingStatus: false,
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
    const { message, args } = compressed
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker

    switch (this.client.utils.find.matchObj({ on: false, off: true, 켜기: false, 끄기: true }, args[0], compressed.guildData.audioPlayrelated)) {
      case true:
        message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_RELATED_OFF'))
        this.client.database.updateGuild(message.guild.id, { $set: { audioPlayrelated: false } })
        break
      case false:
        message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_RELATED_ON'))
        this.client.database.updateGuild(message.guild.id, { $set: { audioPlayrelated: true } })
        break
    }
  }
}

module.exports = Command
