const fetch = require('node-fetch')
const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'fr24',
      aliases: ['flightrader'],
      category: 'BOT_OWNER',
      require_nodes: false,
      require_voice: false,
      hide: false,
      permissions: ['BotOwner']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message } = compressed
    const result = await fetch('http://localhost:8754/monitor.json').then(res => res.json())
    message.channel.send(new Discord.MessageEmbed().setColor(this.client.utils.findUtil.getColor(message.guild.me)).setTitle('Flightradar24 Feeder/Decoder').setDescription(`FR24Link: Connected via **${result.feed_current_mode}**\nFR24 Rader Code: **${result.feed_alias}**\nAircraft Tracked (ModeS & ADS-B): **${result.d11_map_size}**\nAircraft Uploaded: **${result.feed_num_ac_tracked}**\nMLAT Status: **${result['mlat-ok']}**`))
  }
}

module.exports = Command
