const { BaseCommand } = require('../../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'pause',
      ['일시정지'],
      ['DJ', 'Administrator'],
      'MUSIC_DJ',
      {
        audioNodes: true,
        playingStatus: true,
        voiceStatus: {
          listenStatus: true,
          sameChannel: true,
          voiceIn: true
        }
      },
      false
    )
  }

  async run ({ message, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    if (!this.client.audio.players.get(message.guild.id) && guildData.nowplaying.track) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PAUSE_ALREADY_PAUSED'))
    await this.client.audio.stop(message.guild.id, false)
    await message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PAUSE_PAUSED'))
  }
}

module.exports = Command
