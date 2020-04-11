const { BaseCommand } = require('../../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'forceskip',
      ['강제건너뛰기', 'fskip', 'ㄹ나ㅑㅔ'],
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
      [],
      false
    )
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message, guildData } = compressed
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    if (!guildData.queue.shift() || !guildData.nowplaying.track) return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_NOTHING_TO_SKIP'))
    if (guildData.nowplaying.track && this.client.audio.players.get(message.guild.id)) {
      const placeHolder = {
        TITLE: this.client.audio.utils.formatTrack(guildData.nowplaying.info),
        REQUEST: message.guild.members.cache.get(guildData.nowplaying.request) ? message.guild.members.cache.get(guildData.nowplaying.request).displayName : picker.get(locale, 'UNKNOWN')
      }
      this.client.audio.queue.skip(message.guild.id)
      return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
    } else {
      return message.channel.send(picker.get(locale, 'AUDIO_NOPLAYER'))
    }
  }
}

module.exports = Command
