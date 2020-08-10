const { BaseCommand } = require('../../../structures')
const { UsageFailedError } = require('../../../errors')
class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'karaoke',
      ['노래방'],
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

  async run ({ message, args, guildData }) {
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    const filterVal = this.client.audio.filters.getFilterValue(message.guild.id, 'karaoke')
    if (args.length === 0) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_KARAOKE_BASE', { VAL: filterVal ? filterVal.level : picker.get(locale, 'UNSET'), DESC: '' }))
    else {
      if (!Number.isInteger(Number(args[0]))) throw new UsageFailedError(this.name)
      if (Number(args[0]) < 0) return message.channel.send(picker.get(locale, 'LOWERTHANX', { NUM: '0' }))
      if (Number(args[0]) > 10) return message.channel.send(picker.get(locale, 'HIGHERTHANX', { NUM: '10' }))
      if (Number(args[0]) === 1) {
        this.client.audio.filters.clearFilters(message.guild.id)
        return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_KARAOKE_BASE', { VAL: 1, DESC: picker.get(locale, 'COMMANDS_AUDIO_KARAOKE_UNSTABLE') }))
      }
      return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_KARAOKE_BASE', { VAL: this.client.audio.filters.setKaraoke(message.guild.id, Number(args[0])).level, DESC: picker.get(locale, 'COMMANDS_AUDIO_KARAOKE_UNSTABLE') }))
    }
  }
}

module.exports = Command
