const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'language',
      ['언어', 'lang', 'locale'],
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
    const { message, guildData, args } = compressed
    const { locale } = guildData
    const embed = new Discord.MessageEmbed()
    if (args[0] && picker.locales.keyArray().includes(args[0].toLowerCase())) {
      message.channel.send(picker.get(args[0].toLowerCase(), 'COMMANDS_LANGUAGE_CHANGED'))
      this.client.database.updateGuild(message.guild.id, { $set: { locale: args[0].toLowerCase() } })
    } else {
      const functionList = []
      const flagList = picker.locales.keyArray().map(el => picker.get(el, 'FLAG'))
      embed.setColor(this.client.utils.find.getColor(message.guild.me))
      embed.setTitle(picker.get(locale, 'COMMANDS_LANGUAGE_EMBED_TITLE'))
      picker.locales.keyArray().map(el => embed.addFields({ name: `${picker.get(el, 'FLAG')} ${picker.get(el, 'NAME')}`, value: picker.get(el, 'COMMANDS_LANGUAGE_SET_DESC') }))
      message.channel.send(embed).then(m => {
        this.client.utils.message.massReact(m, picker.locales.keyArray().map(el => picker.get(el, 'FLAG'))).then(() => {
          const filter = (reaction, user) => flagList.includes(reaction.emoji.name) && user.id === message.author.id
          const collector = m.createReactionCollector(filter, { time: 10000 })
          picker.locales.keyArray().map(el => functionList.push(async (r) => {
            r.users.remove(message.author)
            message.channel.send(picker.get(el, 'COMMANDS_LANGUAGE_CHANGED'))
            this.client.database.updateGuild(message.guild.id, { $set: { locale: el } })
            collector.stop()
          }))
          collector.on('collect', r => {
            const index = flagList.findIndex((el) => el === r.emoji.name)
            functionList[index](r).catch((e) => {
              throw e
            })
          })
          collector.on('end', (...args) => {
            if (m.deletable && m.deleted === false) m.delete()
            if (args[1] === 'time') return message.channel.send(picker.get(locale, 'GENERAL_TIMED_OUT')).then((m) => m.delete({ timeout: 5000 }))
          })
        })
      })
    }
  }
}

module.exports = Command
