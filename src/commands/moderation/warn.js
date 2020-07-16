const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'warn',
      ['경고'],
      ['Administrator'],
      'MODERATION',
      {
        audioNodes: false,
        playingStatus: false,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceIn: false
        }
      },
      false
    )
  }

  async run ({ message, args, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
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
    const res = await this.client.utils.find.findElement(options)
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
      const updatedUserData = await this.client.database.getMember(member.id, member.guild.id)
      const guildData = await this.client.database.getGuild(message.guild.id)
      const embed = new Discord.MessageEmbed()
        .setTitle(picker.get(locale, 'WARN_EMBED_ADDED_TITLE'))
        .addField(
          picker.get(locale, 'WARN_EMBED_ADDED_COP_TITLE'),
          picker.get(locale, 'WARN_EMBED_ADMIN_DESC', { USER: message.author, TAG: message.author.tag, ID: message.author.id }),
          true
        )
        .addField(
          picker.get(locale, 'WARN_EMBED_ADDED_PRISONER_TITLE'),
          picker.get(locale, 'WARN_EMBED_USER_DESC', { USER: member, TAG: member.user.tag, ID: member.id }),
          true
        )
        .addField(
          picker.get(locale, 'WARN_EMBED_INFO_TITLE'),
          picker.get(locale, 'WARN_EMBED_INFO_DESC', { MAX: guildData.warningMax, CURRENT: updatedUserData.warningCount, REASON: why }),
          true
        )
        .setColor(this.client._options.embed.warn)
        .setFooter(picker.get(locale, 'WARN_EMBED_ADDED_FOOTER'))
        .setTimestamp(obj.date)
      message.channel.send(embed)
      this.client.loggerManager.send('warn', message.guild, { embed })
      if (updatedUserData.warningCount >= guildData.warningMax) { this.client.commands.get('ban').ban({ member, args: picker.get(locale, 'WARN_BANNED_REASON', { MAX: guildData.warningMax }).split(' '), picker, locale, message }) }
    }
  }
}

module.exports = Command
