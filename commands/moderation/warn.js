const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'warn',
      aliases: ['경고', 'ㅈㅁ구'],
      category: 'MODERATION',
      require_nodes: false,
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
    const locale = compressed.guildData.locale
    const { message, args, command } = compressed
    if (!args[0]) return message.channel.send(picker.get(locale, 'INCORRECT_USAGE', { COMMAND_USAGE: picker.get(locale, `USAGE_${this.command.category}_${this.command.name.toUpperCase()}`, { COMMAND: command }) }))
    const search = args.shift()
    const filter = (a) => { return a.displayName.toLowerCase() === search.toLowerCase() || a.id === search || a.id === (this.client.utils.find.getUserFromMention(message.guild.members.cache, search) ? this.client.utils.find.getUserFromMention(message.guild.members.cache, search).id : null) || a.user.username.toLowerCase() === search.toLowerCase() }
    const options = {
      title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
      formatter: this.client.utils.find.formatters.guildMember,
      collection: message.guild.members.cache,
      filter: filter,
      message: message,
      locale: locale,
      picker: picker
    }
    this.client.utils.find.findElement(options).then(async (res) => {
      if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
      const member = message.guild.members.cache.get(res.user ? res.user.id : null)
      if (member.user.bot === true) {
        return message.channel.send(picker.get(locale, 'COMMANDS_MOD_WARN_NO_BOT'))
      } else if (member) {
        const why = !(args.join(' ').length === 0 ? null : args.join(' ')) ? picker.get(locale, 'NONE') : args.join(' ')
        const obj = Object.assign({
          why: why,
          date: new Date(),
          admin: message.author.id
        })
        await this.client.database.updateMember(member.id, member.guild.id, { $inc: { warningCount: 1 }, $push: { warningArray: obj } })
        const guildData = await this.client.database.getGuild(message.guild.id)
        const updatedUserData = await this.client.database.getMember(member.id, member.guild.id)
        const embed = new Discord.MessageEmbed()
          .setTitle(picker.get(locale, 'WARN_EMBED_ADDED_TITLE'))
          .addFields({ name: picker.get(locale, 'WARN_EMBED_ADDED_COP_TITLE'), value: picker.get(locale, 'WARN_EMBED_ADMIN_DESC', { USER: message.author, TAG: message.author.tag, ID: message.author.id }), inline: true })
          .addFields({ name: picker.get(locale, 'WARN_EMBED_ADDED_PRISONER_TITLE'), value: picker.get(locale, 'WARN_EMBED_USER_DESC', { USER: member, TAG: member.user.tag, ID: member.id }), inline: true })
          .addFields({ name: picker.get(locale, 'WARN_EMBED_INFO_TITLE'), value: picker.get(locale, 'WARN_EMBED_INFO_DESC', { MAX: guildData.warningMax, CURRENT: updatedUserData.warningCount, REASON: why }), inline: true })
          .setColor(this.client._options.others.modEmbeds.warn)
          .setFooter(picker.get(locale, 'WARN_EMBED_ADDED_FOOTER'))
          .setTimestamp(obj.date)
        message.channel.send(embed)
        this.client.loggerManager.send('warn', message.guild, { embed })
        if (updatedUserData.warningCount >= guildData.warningMax) { this.client.commands.get('ban').ban({ member, args: picker.get(locale, 'WARN_BANNED_REASON', { MAX: guildData.warningMax }).split(' '), picker, locale, message }) }
      }
    })
  }
}

module.exports = Command
