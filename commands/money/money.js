class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'money',
      aliases: ['돈', 'ehs'],
      category: 'COMMANDS_MONEY_GENERAL',
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const picker = this.client.utils.localePicker
    const locale = compressed.GuildData.locale
    const { message, GlobalUserData, args } = compressed
    if (!args[0]) return message.channel.send(picker.get(locale, 'COMMANDS_MONEY_BALANCE_ME', { MONEY: GlobalUserData.money }))
    const formatter = (a, number) => { return `[${number}] ${a.user.bot ? '[BOT]' : ''} ${a.displayName} (${a.user.tag}) [${a.id}]` }
    const filter = (a) => { return a.displayName.toLowerCase() === args[0].toLowerCase() || a.id === args[0] || a.id === this.client.utils.findUtil.getUserFromMention(this.client.users, args[0]).id || a.user.username.toLowerCase() === args[0].toLowerCase() }
    const options = {
      title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
      formatter: formatter,
      collection: message.guild.members,
      filter: filter,
      message: message,
      locale: locale,
      picker: picker
    }
    this.client.utils.findUtil.findElement(options).then(async (res) => {
      if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
      const user = res.user
      if (user.bot === true) {
        return message.channel.send(picker.get(locale, 'COMMANDS_MONEY_BOT'))
      } else if (user) {
        const data = await this.client.database.getGlobalUserData(user)
        if (!data) return message.channel.send(picker.get(locale, 'COMMANDS_MONEY_UNREGI'))
        message.channel.send(picker.get(locale, 'COMMANDS_MONEY_BALANCE_OTHER', { USER_TAG: user.tag, MONEY: data.money }))
      }
    })
  }
}

module.exports = Command
