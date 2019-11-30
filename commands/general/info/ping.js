const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'ping',
      aliases: ['ㅔㅑㅜㅎ', '핑'],
      category: 'COMMANDS_GENERAL',
      require_voice: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  run (compressed) {
    const { message } = compressed
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker
    const embed = new Discord.RichEmbed()

    embed.setTitle(picker.get(locale, 'COMMANDS_PING_PING'))
    embed.setColor(this.client.utils.findUtil.getColor(message.member))
    embed.setDescription(picker.get(locale, 'COMMANDS_PING_PINGING'))

    message.reply(embed).then((m) => {
      embed.setTitle(picker.get(locale, 'COMMANDS_PING_PONG'))
      embed.setDescription(picker.get(locale, 'COMMANDS_PING_RESULT', { WEBSOCKET: `${this.client.pings.join('ms **=>** ')}ms`, RESPONCE: `${m.createdAt - message.createdTimestamp}ms` }))
      embed.setFooter(`${message.member.displayName}`, message.author.displayAvatarURL)
      m.edit(message.author, embed)
    })
  }
}

module.exports = Command
