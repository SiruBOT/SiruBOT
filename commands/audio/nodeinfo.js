const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'nodeinfo',
      aliases: ['ㅜㅐㅇ댜ㅜ래'],
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const { message } = compressed
    const Audio = this.client.audio
    const embed = new Discord.RichEmbed()
    const array = []
    for (const item of Audio.manager.nodes.array()) {
      array.push(`Node ${array.length + 1} ${item.ready === true ? `(${item.stats.playingPlayers} Players) ||${item.host}||` : `Not Ready ||${item.host}||`}`)
    }
    embed.setTitle('Lavalink Nodes')
    embed.setDescription(array.join('\n'))
    embed.setColor('#7289DA')
    message.channel.send(embed)
  }
}

module.exports = Command
