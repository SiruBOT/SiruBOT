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
    const user = getUserFromMention(this.client.users, args[0])
    if (user.bot === true) {
      return message.reply(picker.get(locale, 'COMMANDS_MONEY_BOT'))
    } else if (user) {
      const data = await this.client.database.getGlobalUserData(user)
      if (!data) return message.reply()
      message.reply(picker.get(locale, 'COMMANDS_MONEY_BALANCE_OTHER', { USER_TAG: user.tag, MONEY: data.money }))
    } else {
      message.reply(picker.get(locale, 'COMMANDS_MONEY_BALANCE_ME', { USER_TAG: user.tag, MONEY: GlobalUserData.money }))
    }
  }
}

/**
* @param {Map} users - Bot's Users (Collection)
* @param {String} mention - Discord Mention String
*/
function getUserFromMention (users, mention) {
  if (!mention) return false

  if (mention.startsWith('<@') && mention.endsWith('>')) {
    mention = mention.slice(2, -1)

    if (mention.startsWith('!')) {
      mention = mention.slice(1)
    }
    return users.get(mention)
  } else {
    return false
  }
}

module.exports = Command
