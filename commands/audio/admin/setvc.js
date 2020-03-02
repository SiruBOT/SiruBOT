class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'setvc',
      aliases: ['ㄴㄷㅅㅍㅊ'],
      category: 'MODERATION',
      require_voice: false,
      require_nodes: false,
      hide: false,
      permissions: ['Administrator']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
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
      const formatter = (channel, number) => { return `[${number}] #${channel.name} [${channel.id}]` }
      const filter = (channel) => { return channel.name.toLowerCase() === args.join(' ').toLowerCase() || channel.id === args.join(' ') || channel.id === (message.mentions.channels.array()[0] === undefined ? false : message.mentions.channels.array()[0].id) }
      const options = {
        title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
        formatter: formatter,
        collection: message.guild.channels.cache.filter(el => el.type === 'voice'),
        filter: filter,
        message: message,
        locale: locale,
        picker: picker
      }
      this.client.utils.find.findElement(options).then(async (res) => {
        if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
        message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETVC_SET', { CHANNEL: `<#${res.id}>` }))
        this.client.database.updateGuild(message.guild.id, { $set: { vch: res.id } })
      })
    }
  }
}

module.exports = Command
