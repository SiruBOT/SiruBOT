const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'skip',
      ['스킵', '건너뛰기', '나ㅑㅔ'],
      ['Everyone'],
      'MUSIC_GENERAL',
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

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message, guildData } = compressed
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    if (!guildData.queue[0] || !guildData.nowplaying.track) return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_NOTHING_TO_SKIP'))
    if (guildData.nowplaying.track && this.client.audio.players.get(message.guild.id)) {
      const placeHolder = {
        TITLE: this.client.audio.utils.formatTrack(guildData.nowplaying.info),
        REQUEST: message.guild.members.cache.get(guildData.nowplaying.request) ? message.guild.members.cache.get(guildData.nowplaying.request).displayName : picker.get(locale, 'UNKNOWN')
      }
      if (guildData.nowplaying.request === message.author.id) {
        this.client.audio.queue.skip(message.guild.id)
        return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
      } else {
        const toSkip = Math.round(message.member.voice.channel.members.filter(m => !m.user.bot).size / 2)
        const skipperSize = this.client.audio.utils.addSkipper(message.guild.id, message.author.id, toSkip).length
        message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIP_REQUESTED', {
          TITLE: this.client.audio.utils.formatTrack(guildData.nowplaying.info),
          CURRENT: skipperSize,
          TOSKIP: toSkip,
          REQUEST: message.guild.members.cache.get(guildData.nowplaying.request) ? message.guild.members.cache.get(guildData.nowplaying.request).displayName : picker.get(locale, 'UNKNOWN')
        }))
        if (this.client.audio.skippers.get(message.guild.id).length >= toSkip) {
          this.client.audio.queue.skip(message.guild.id)
          return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
        }
      }
    } else {
      return message.channel.send(picker.get(locale, 'AUDIO_NOPLAYER'))
    }
  }
}

module.exports = Command
