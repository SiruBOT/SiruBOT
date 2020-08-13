const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'skip',
      ['스킵', '건너뛰기'],
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

  async run ({ message }) {
    const guildData = await this.client.database.getGuild(message.guild.id)
    const { locale, nowplaying } = guildData
    const picker = this.client.utils.localePicker
    if (nowplaying.track && this.client.audio.players.get(message.guild.id)) {
      const placeHolder = {
        TITLE: this.client.audio.utils.formatTrack(nowplaying.info),
        REQUEST: message.guild.members.cache.get(nowplaying.request) ? message.guild.members.cache.get(nowplaying.request).displayName : picker.get(locale, 'UNKNOWN')
      }
      if (nowplaying.request === message.author.id) {
        await this.client.audio.queue.skip(message.guild.id)
        return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
      } else {
        const toSkip = Math.round(message.member.voice.channel.members.filter(m => !m.user.bot).size / 2)
        const skipperSize = this.client.audio.utils.addSkipper(message.guild.id, message.author.id, toSkip).length
        await message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIP_REQUESTED', {
          TITLE: this.client.audio.utils.formatTrack(nowplaying.info),
          CURRENT: skipperSize,
          TOSKIP: toSkip,
          REQUEST: message.guild.members.cache.get(nowplaying.request) ? message.guild.members.cache.get(nowplaying.request).displayName : picker.get(locale, 'UNKNOWN')
        }))
        if (this.client.audio.skippers.get(message.guild.id).length >= toSkip) {
          await this.client.audio.queue.skip(message.guild.id)
          return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
        }
      }
    } else {
      return message.channel.send(picker.get(locale, 'AUDIO_NOPLAYER'))
    }
  }
}

module.exports = Command
