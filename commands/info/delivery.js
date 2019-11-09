// const Discord = require('discord.js')
const carriers = require('./carriers.json')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'delivery',
      aliases: ['택배', '택배조회'],
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  run (compressed) {
    const { message, args } = compressed
    message.channel.send('Dev')
  }
}
module.exports = Command
