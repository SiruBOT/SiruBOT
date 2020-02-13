const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'ban',
      aliases: ['밴', '차단', 'ㅠ무'],
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
    if (!args[0]) return message.channel.send(picker.get(locale, 'COMMANDS_MOD_BAN_TYPE_USER'))
    const formatter = (a, number) => { return `[${number}] ${a.user.bot ? '[BOT]' : ''} ${a.displayName} (${a.user.tag}) [${a.id}]` }
    const search = args.shift()
    const filter = (a) => { return a.displayName.toLowerCase() === search.toLowerCase() || a.id === search || a.id === this.client.utils.findUtil.getUserFromMention(this.client.users, search).id || a.user.username.toLowerCase() === search.toLowerCase() }
    const options = {
      title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
      formatter: formatter,
      collection: message.guild.members.cache,
      filter: filter,
      message: message,
      locale: locale,
      picker: picker
    }
    this.client.utils.findUtil.findElement(options).then(async (res) => {
      if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
      const member = message.guild.members.cache.get(res.user ? res.user.id : null)
      if (member.user.bot === true) {
        return message.channel.send(picker.get(locale, 'COMMANDS_MOD_WARN_NO_BOT'))
      } else if (member) {
        const why = !(args.join(' ').length === 0 ? null : args.join(' ')) ? picker.get(locale, 'NONE') : args.join(' ')
        const embed = new Discord.MessageEmbed()
        member.ban().then(() => {
          embed.setTitle(picker.get(locale, 'BAN_EMBED_TITLE'))
            .addField(picker.get(locale, 'BAN_EMBED_COP_TITLE'), picker.get(locale, 'WARN_EMBED_ADMIN_DESC', { USER: message.author, TAG: message.author.tag, ID: message.author.id }), true)
            .addField(picker.get(locale, 'BAN_EMBED_PRISONER_TITLE'), picker.get(locale, 'WARN_EMBED_USER_DESC', { USER: member, TAG: member.user.tag, ID: member.id }), true)
            .addField(picker.get(locale, 'BAN_EMBED_INFO_TITLE'), picker.get(locale, 'BAN_EMBED_INFO_DESC', { REASON: why }), true)
            .setColor(this.client._options.others.modEmbeds.ban)
            .setTimestamp(new Date())
          message.channel.send(embed)
          this.client.loggerManager.send('ban', message.guild, { embed })
        }).catch((e) => {
          message.channel.send('Errored ' + e.message)
        })
      }
    })
  }
}

module.exports = Command
