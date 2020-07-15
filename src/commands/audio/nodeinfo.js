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
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'nodeinfo',
      ['봇정보'],
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

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    const embed = new Discord.MessageEmbed()
    for (const item of this.client.audio.nodes.values()) {
      embed.addField(`**${item.name}** ${item.state === 'CONNECTED' ? `, (${item.players.size} Players)` : `, ${item.state}`}`, `**${niceBytes(item.stats.memory.used)}** Used
**${item.stats.cpu.cores}** Cores
**${this.toFixed(item.stats.cpu.systemLoad)}%** System Loads
**${this.toFixed(item.stats.cpu.lavalinkLoad)}%** Lavalink Loads`, true)
    }
    embed.setTitle('Lavalink Nodes Info')
    embed.setFooter('Powered by npmjs.org/shoukaku')
    embed.setColor('#7289DA')
    await message.channel.send(embed)
  }

  toFixed (load) {
    return Number(load * 100).toFixed(2)
  }
}

module.exports = Command
