class Command {
  constructor (client) {
    this.client = client
    this.name = 'setvc'
    this.aliases = ['음성채널설정', 'ㄴㄷㅅㅍㅊ']
    this.category = 'MODERATION'
    this.requirements = {
      audioNodes: false,
      playingStatus: false,
      voiceStatus: {
        listenStatus: false,
        sameChannel: false,
        voiceIn: false
      }
    }
    this.hide = false
    this.permissions = ['Administrator']
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const picker = this.client.utils.localePicker
    const locale = compressed.guildData.locale
    const { message, args, command } = compressed
    if (!args[0]) return message.channel.send(picker.get(locale, 'INCORRECT_USAGE', { COMMAND_USAGE: picker.get(locale, `USAGE_${this.command.category}_${this.command.name.toUpperCase()}`, { COMMAND: command }) }))
    if (['none', '없음', 'null', 'remove', '지우기'].includes(args.join(' ').toLowerCase())) {
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETVC_NONE'))
      this.client.database.updateGuild(message.guild.id, { $set: { vch: '0' } })
    } else {
      const filter = (channel) => { return channel.name.toLowerCase() === args.join(' ').toLowerCase() || channel.id === args.join(' ') || channel.id === (message.mentions.channels.array()[0] === undefined ? false : message.mentions.channels.array()[0].id) }
      const options = {
        title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
        formatter: this.client.utils.find.formatters.channel,
        collection: message.guild.channels.cache.filter(el => el.type === 'voice'),
        filter: filter,
        message: message,
        locale: locale,
        picker: picker
      }
      const res = this.client.utils.find.findElement(options)
      if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETVC_SET', { CHANNEL: `<#${res.id}>` }))
      this.client.database.updateGuild(message.guild.id, { $set: { vch: res.id } })
    }
  }
}

module.exports = Command
