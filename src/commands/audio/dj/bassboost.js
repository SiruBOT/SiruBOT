const { BaseCommand } = require('../../../structures')
const { UsageFailedError } = require('../../../errors')
class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'bassboost',
      ['베이스부스트', 'bb'],
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
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    const filterVal = this.client.audio.filters.getFilterValue(message.guild.id, 'bboost')
    if (args.length === 0) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_BASSBOOST_BASE', { VAL: filterVal ? filterVal.percentage + '%' : picker.get(locale, 'UNSET'), DESC: '' }))
    else {
      if (!Number.isInteger(Number(args[0]))) throw new UsageFailedError(this.name)
      if (Number(args[0]) < 0) return message.channel.send(picker.get(locale, 'LOWERTHANX', { NUM: '0%' }))
      if (Number(args[0]) > 500) return message.channel.send(picker.get(locale, 'HIGHERTHANX', { NUM: '500%' }))
      return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_BASSBOOST_BASE', { VAL: this.client.audio.filters.bassboost(message.guild.id, Number(args[0])).percentage + '%', DESC: picker.get(locale, 'COMMANDS_AUDIO_EFFECT_DELAY') }))
    }
  }
}

module.exports = Command
