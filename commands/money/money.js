class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: '돈',
      aliases: ['money', 'ehs'],
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
    if (!args[0]) return message.reply(picker.get(locale, 'COMMANDS_MONEY_BALANCE_ME', { MONEY: GlobalUserData.money }))
    const formatter = (a, number) => { return `[${number}] ${a.user.bot ? '[BOT]' : ''} ${a.displayName} (${a.user.tag}) [${a.id}]` }
    const filter = (a) => { return a.displayName.toLowerCase() === args[0].toLowerCase() || a.id === args[0] || a.id === this.client.utils.findUtil.getUserFromMention(this.client.users, args[0]).id || a.user.username.toLowerCase() === args[0].toLowerCase() }
    const options = {
      formatter: formatter,
      collection: message.guild.members,
      filter: filter,
      message: message,
      locale: locale,
      picker: picker
    }
    this.client.utils.findUtil.findElement(options).then(async (res) => {
      if (!res) return picker.get(locale, 'GENERAL_NO_RESULT')
      const user = res.user
      if (user.bot === true) {
        return message.reply(picker.get(locale, 'COMMANDS_MONEY_BOT'))
      } else if (user) {
        const data = await this.client.database.getGlobalUserData(user)
        if (!data) return message.reply(picker.get(locale, 'COMMANDS_MONEY_UNREGI'))
        message.reply(picker.get(locale, 'COMMANDS_MONEY_BALANCE_OTHER', { USER_TAG: user.tag, MONEY: data.money }))
      }
    })
  }
}

module.exports = Command
