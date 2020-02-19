const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'language',
      aliases: ['언어', 'ㅣ무혐ㅎㄷ', 'lang', 'locale'],
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
    const { message, GuildData, args } = compressed
    const { locale } = GuildData
    const embed = new Discord.MessageEmbed()
    if (args[0] && picker.locales.keyArray().includes(args[0].toLowerCase())) {
      message.channel.send(picker.get(args[0].toLowerCase(), 'COMMANDS_LANGUAGE_CHANGED'))
      this.client.database.updateGuild(message.guild.id, { $set: { locale: args[0].toLowerCase() } })
    } else {
      const functionList = []
      const flagList = picker.locales.keyArray().map(el => picker.get(el, 'FLAG'))
      embed.setColor(this.client.utils.findUtil.getColor(message.guild.me))
      embed.setTitle(picker.get(locale, 'COMMANDS_LANGUAGE_EMBED_TITLE'))
      picker.locales.keyArray().map(el => embed.addField(`${picker.get(el, 'FLAG')} ${picker.get(el, 'NAME')}`, picker.get(el, 'COMMANDS_LANGUAGE_SET_DESC')))
      message.channel.send(embed).then(m => {
        this.client.utils.massReact(m, picker.locales.keyArray().map(el => picker.get(el, 'FLAG'))).then(() => {
          const filter = (reaction, user) => flagList.includes(reaction.emoji.name) && user.id === message.author.id
          const collector = m.createReactionCollector(filter, { time: 10000 })
          picker.locales.keyArray().map(el => functionList.push((r) => {
            r.remove(message.author)
            message.channel.send(picker.get(el, 'COMMANDS_LANGUAGE_CHANGED'))
            this.client.database.updateGuild(message.guild.id, { $set: { locale: el } })
            collector.stop()
          }))
          collector.on('collect', r => {
            const index = flagList.findIndex((el) => el === r.emoji.name)
            functionList[index](r)
          })
          collector.on('end', (...args) => {
            if (m.deletable && m.deleted === false) m.delete()
            if (args[1] === 'time') return message.channel.send(picker.get(locale, 'GENERAL_TIMED_OUT')).then((m) => m.delete(5000))
          })
        })
      })
    }
  }
}

module.exports = Command
