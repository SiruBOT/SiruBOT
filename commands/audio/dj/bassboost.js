class Command {
  constructor (client) {
    this.client = client
    this.name = 'bassboost'
    this.aliases = ['베이스부스트', 'ㅠㅁㄴ뉴ㅐㅐㄴㅅ', 'bb']
    this.category = 'MUSIC_DJ'
    this.requirements = {
      audioNodes: true,
      playingStatus: true,
      voiceStatus: {
        listenStatus: true,
        sameChannel: true,
        voiceIn: true
      }
    }
    this.hide = false
    this.permissions = ['DJ', 'Administrator']
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
