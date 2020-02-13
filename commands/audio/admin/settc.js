class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'settc',
      aliases: ['ㄴㄷㅅㅅㅊ'],
      category: 'COMMANDS_MODERATION',
      require_voice: false,
      hide: false,
      permissions: ['Administrator']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const picker = this.client.utils.localePicker
    const locale = compressed.GuildData.locale
    const { message, args } = compressed
    if (!args[0]) return message.channel.send('No')
    if (['none', '없음', 'null', 'remove', '지우기'].includes(args.join(' ').toLowerCase())) {
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETTC_NONE'))
      this.client.database.updateGuildData(message.guild.id, { $set: { tch: '0' } })
    } else {
      const formatter = (channel, number) => { return `[${number}] #${channel.name} [${channel.id}]` }
      const filter = (channel) => { return channel.name.toLowerCase() === args.join(' ').toLowerCase() || channel.id === args.join(' ') || channel.id === (message.mentions.channels.array()[0] === undefined ? false : message.mentions.channels.array()[0].id) }
      const options = {
        title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
        formatter: formatter,
        collection: message.guild.channels.cache.filter((el) => el.type === 'text'),
        filter: filter,
        message: message,
        locale: locale,
        picker: picker
      }
      this.client.utils.findUtil.findElement(options).then(async (res) => {
        if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
        message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETTC_SET', { CHANNEL: `<#${res.id}>` }))
        this.client.database.updateGuildData(message.guild.id, { $set: { tch: res.id } })
      })
    }
  }
}

module.exports = Command
