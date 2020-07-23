const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')
const moment = require('moment')
const Melon = require('melon-chart-api')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'melon',
      ['멜론', '멜론차트'],
      ['Everyone'],
      'MUSIC_GENERAL',
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

  async run ({ message }) {
    const embed = new Discord.MessageEmbed()
    Melon().realtime()
  }
}

module.exports = Command
