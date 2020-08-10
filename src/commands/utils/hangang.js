const fetch = require('node-fetch')
const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'hangang',
      ['한강'],
      ['Everyone'],
      'GENERAL_INFO',
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

  async run ({ message, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    const embed = new Discord.MessageEmbed()
      .setColor(this.client.utils.find.getColor(message.guild.me))
    try {
      const result = await fetch('http://hangang.dkserver.wo.tc/')
      const json = await result.json()
      embed.setAuthor(picker.get(locale, 'COMMANDS_HANGANG_TEMP', { TEMP: json.temp, TIME: json.time }), 'https://images.vexels.com/media/users/3/146228/isolated/lists/685088eecf6250447d473e7ae3b0a5da-blue-water-drops-icon.png')
      await message.reply(embed)
    } catch {
      embed.setAuthor(picker.get(locale, 'COMMANDS_HANGANG_TEMP_ERROR'), 'https://images.vexels.com/media/users/3/146228/isolated/lists/685088eecf6250447d473e7ae3b0a5da-blue-water-drops-icon.png')
      await message.reply(embed)
    }
  }
}

module.exports = Command
