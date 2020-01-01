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
    const { message, GuildData } = compressed
    const { locale } = GuildData
    const embed = new Discord.RichEmbed()
    embed.setColor(this.client.utils.findUtil.getColor(message.guild.me))
    embed.setTitle(picker.get(locale, 'COMMANDS_LANGUAGE_EMBED_TITLE'))
    picker.locales.keyArray().map(el => embed.addField(`${picker.get(el, 'FLAG')} ${picker.get(el, 'NAME')}`, picker.get(el, 'COMMANDS_LANGUAGE_SET_DESC')))
    message.channel.send(embed).then(m => {
      this.client.utils.massReact(m, picker.locales.keyArray().map(el => picker.get(el, 'FLAG')))
    })
  }
}

module.exports = Command
