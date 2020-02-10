class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'warn',
      aliases: ['경고', 'ㅈㅁ구'],
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
    if (!args[0]) return message.channel.send(picker.get(locale, 'COMMANDS_MOD_WARN_TYPE_USER'))
    const formatter = (a, number) => { return `[${number}] ${a.user.bot ? '[BOT]' : ''} ${a.displayName} (${a.user.tag}) [${a.id}]` }
    const search = args.shift()
    const filter = (a) => { return a.displayName.toLowerCase() === search.toLowerCase() || a.id === search || a.id === this.client.utils.findUtil.getUserFromMention(this.client.users, search).id || a.user.username.toLowerCase() === search.toLowerCase() }
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
        return message.channel.send(picker.get(locale, 'COMMANDS_MOD_WARN_NO_BOT'))
      } else if (user) {
        let why
        why = args.join(' ')
        if (why.length === 0) why = null
        const obj = {
          why: why,
          date: new Date(),
          admin: message.author.id
        }
        this.client.database.updateGuildMemberData(message.guild.members.get(user.id), { $inc: { warningCount: 1 }, $push: { warningArray: obj } })
        this.client.loggerManager.send('warn', message.guild, user, obj)
      }
    })
  }
}

module.exports = Command
