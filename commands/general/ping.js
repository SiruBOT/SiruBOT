const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.name = 'ping'
    this.aliases = ['핑', 'ㅔㅑㅜㅎ']
    this.category = 'GENERAL_INFO'
    this.requirements = {
      audioNodes: false,
      playingStatus: false,
      voiceStatus: {
        listenStatus: false,
        sameChannel: false,
        voiceIn: false
      }
    }
    this.hide = false
    this.permissions = ['Everyone']
  }

  /**
   * @param {Object} compressed - Compressed Object
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
