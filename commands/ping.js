const Discord = require('discord.js')
const { getColor } = require('../modules/findUtil')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'ping',
      aliases: ['ㅔㅑㅜㅎ', '핑'],
      description: '핑',
      permissions: ['Everyone']
    }
  }

  run (compressed) {
    const { message } = compressed
    // message.channel.send(`${message.member}\n> 핑 측정 중...`).then(m => {
    //   m.edit(`${message.member}\n> 웹소켓 핑: ${this.client.pings.join('ms **=>** ')}ms\n> 메세지 반응 핑: ${m.createdAt - message.createdTimestamp}ms`)
    // })
    const embed = new Discord.RichEmbed()
    embed.setTitle('🏓 핑!')
    embed.setColor(getColor(message.member))
    embed.setDescription('핑 측정 중...')
    message.reply(embed).then((m) => {
      embed.setTitle('🏓 퐁!')
      embed.setDescription(`웹소켓 핑: ${this.client.pings.join('ms **=>** ')}ms\n메세지 반응 핑: ${m.createdAt - message.createdTimestamp}ms`)
      embed.setFooter(`${message.member.displayName}`, message.author.displayAvatarURL)
      m.edit(message.author, embed)
    })
  }
}

module.exports = Command
