class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'setdj',
      aliases: ['ㄴㄷㅅ어'],
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
    if (['none', '없음', 'null', 'remove', '지우기'].includes(args[0].toLowerCase())) {
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETDJ_NONE'))
      this.client.database.updateGuildData(message.guild.id, { $set: { dj_role: '0' } })
    } else {
      const formatter = (role, number) => { return `[${number}] ${role.name} [${role.id}]` }
      const filter = (role) => { return role.name.toLowerCase() === args.join(' ').toLowerCase() || role.id === args.join(' ') || role.name.replace('@everyone', 'everyone') === args.join(' ').toLowerCase().replace('@', '') || role.id === (message.mentions.roles.array()[0] === undefined ? false : message.mentions.roles.array()[0].id) }
      const options = {
        title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
        formatter: formatter,
        collection: message.guild.roles.cache,
        filter: filter,
        message: message,
        locale: locale,
        picker: picker
      }
      this.client.utils.findUtil.findElement(options).then(async (res) => {
        if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
        message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETDJ_SET', { DJNAME: res.name }))
        this.client.database.updateGuildData(message.guild.id, { $set: { dj_role: res.id } })
      })
    }
  }
}
module.exports = Command
