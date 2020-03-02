const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'ping',
      aliases: ['핑', 'ㅔㅑㅜㅎ'],
      category: 'GENERAL_INFO',
      require_nodes: false,
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message } = compressed
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker
    const embed = new Discord.MessageEmbed()

    embed.setTitle(picker.get(locale, 'COMMANDS_PING_PING'))
    embed.setColor(this.client.utils.find.getColor(message.member))
    embed.setDescription(picker.get(locale, 'COMMANDS_PING_PINGING'))

    message.channel.send(message.author, embed).then((m) => {
      embed.setTitle(picker.get(locale, 'COMMANDS_PING_PONG'))
      embed.setDescription(picker.get(locale, 'COMMANDS_PING_RESULT', { WEBSOCKET: `${this.client.ws.ping}ms`, RESPONCE: `${m.createdAt - message.createdTimestamp}ms` }))
      m.edit(message.author, embed)
    })
  }
}

module.exports = Command
