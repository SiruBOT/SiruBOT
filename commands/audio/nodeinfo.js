// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript/23625419
const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

function niceBytes (x) {
  let l = 0; let n = parseInt(x, 10) || 0

  while (n >= 1024 && ++l) {
    n = n / 1024
  }
  // include a decimal point and a tenths-place digit if presenting
  // less than ten of KB or greater units
  return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l])
}

const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'nodeinfo',
      aliases: ['ㅜㅐㅇ댜ㅜ래'],
      category: 'MUSIC_GENERAL',
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
    const embed = new Discord.MessageEmbed()
    for (const item of this.client.audio.nodes.values()) {
      embed.addField(`**${item.name}** ${item.state === 'CONNECTED' ? `, (${item.players.size} Players)` : `, ${item.state}`}`,
      `**${niceBytes(item.stats.memory.used)}** Used\n**${item.stats.cpu.cores}** Cores\n**${Number(item.stats.cpu.systemLoad).toFixed(2)}%** System Loads\n**${Number(item.stats.cpu.lavalinkLoad).toFixed(2)}%** Lavalink Loads`)
    }
    embed.setTitle('Lavalink Nodes - Powered By Shoukaku')
    embed.setColor('#7289DA')
    message.channel.send(embed)
  }
}

module.exports = Command
