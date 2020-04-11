const { BaseCommand } = require('../../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'bassboost',
      ['베이스부스트', 'ㅠㅁㄴ뉴ㅐㅐㄴㅅ', 'bb'],
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
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker
    const { message, args } = compressed
    const filterVal = this.client.audio.filters.getFilterValue(message.guild.id, 'bboost')
    if (args.length === 0) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_BASSBOOST_BASE', { VAL: filterVal ? filterVal.percentage + '%' : picker.get(locale, 'UNSET'), DESC: '' }))
    else {
      if (!Number.isInteger(Number(args[0]))) return message.channel.send(picker.get(locale, 'INTEGER'))
      if (Number(args[0]) < 0) return message.channel.send(picker.get(locale, 'LOWERTHANX', { NUM: '0%' }))
      if (Number(args[0]) > 500) return message.channel.send(picker.get(locale, 'HIGHERTHANX', { NUM: '500%' }))
      return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_BASSBOOST_BASE', { VAL: this.client.audio.filters.bassboost(message.guild.id, Number(args[0])).percentage + '%', DESC: picker.get(locale, 'COMMANDS_AUDIO_EFFECT_DELAY') }))
    }
  }
}

module.exports = Command
