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
      [],
      false
    )
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message, guildData } = compressed
    const { locale, queue, nowplaying } = guildData
    const picker = this.client.utils.localePicker
    if (!queue[0] || !nowplaying.track) return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_NOTHING_TO_SKIP'))
    if (nowplaying.track && this.client.audio.players.get(message.guild.id)) {
      const placeHolder = {
        TITLE: this.client.audio.utils.formatTrack(nowplaying.info),
        REQUEST: message.guild.members.cache.get(nowplaying.request) ? message.guild.members.cache.get(nowplaying.request).displayName : picker.get(locale, 'UNKNOWN')
      }
      if (nowplaying.request === message.author.id) {
        await this.skip(message.guild.id, nowplaying)
        return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
      } else {
        const toSkip = Math.round(message.member.voice.channel.members.filter(m => !m.user.bot).size / 2)
        const skipperSize = this.client.audio.utils.addSkipper(message.guild.id, message.author.id, toSkip).length
        message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIP_REQUESTED', {
          TITLE: this.client.audio.utils.formatTrack(nowplaying.info),
          CURRENT: skipperSize,
          TOSKIP: toSkip,
          REQUEST: message.guild.members.cache.get(nowplaying.request) ? message.guild.members.cache.get(nowplaying.request).displayName : picker.get(locale, 'UNKNOWN')
        }))
        if (this.client.audio.skippers.get(message.guild.id).length >= toSkip) {
          await this.skip(message.guild.id, nowplaying)
          return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
        }
      }
    } else {
      return message.channel.send(picker.get(locale, 'AUDIO_NOPLAYER'))
    }
  }

  async skip (guildID, np) {
    if ((np.info.length - this.client.audio.players.get(guildID).position) < 2000) return this.client.audio.queue.skip(guildID)
    return this.client.audio.players.get(guildID).setVolume(1).then(() => {
      setTimeout(() => {
        this.client.audio.queue.skip(guildID)
      }, 1000)
    })
  }
}

module.exports = Command
