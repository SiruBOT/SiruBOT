const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'ban',
      ['밴', '차단', 'ㅠ무'],
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

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const picker = this.client.utils.localePicker
    const locale = compressed.guildData.locale
    const { message, args } = compressed
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
      this.ban({ member, args, picker, locale, message })
    }
  }

  ban ({ member, args, picker, locale, message }) {
    const why = !(args.join(' ').length === 0 ? null : args.join(' ')) ? picker.get(locale, 'NONE') : args.join(' ')
    const embed = new Discord.MessageEmbed()
    member.ban().then(() => {
      embed.setTitle(picker.get(locale, 'BAN_EMBED_TITLE'))
        .addFields({ name: picker.get(locale, 'BAN_EMBED_COP_TITLE'), value: picker.get(locale, 'WARN_EMBED_ADMIN_DESC', { USER: message.author, TAG: message.author.tag, ID: message.author.id }), inline: true })
        .addFields({ name: picker.get(locale, 'BAN_EMBED_PRISONER_TITLE'), value: picker.get(locale, 'WARN_EMBED_USER_DESC', { USER: member, TAG: member.user.tag, ID: member.id }), inline: true })
        .addFields({ name: picker.get(locale, 'BAN_EMBED_INFO_TITLE'), value: picker.get(locale, 'BAN_EMBED_INFO_DESC', { REASON: why }), inline: true })
        .setColor(this.client._options.embed.ban)
        .setTimestamp(new Date())
      message.channel.send(embed)
      this.client.loggerManager.send('ban', message.guild, { embed })
    }).catch((e) => {
      message.channel.send('Errored ' + e.message)
    })
  }
}

module.exports = Command
