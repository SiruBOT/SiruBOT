const fetch = require('node-fetch')
const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'docs',
      ['문서'],
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

  async run ({ message, args, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    if (args.length === 0) return message.channel.send('<@' + message.author.id + '>\n' + picker.get(locale, 'GENERAL_INPUT_QUERY'))
    const result = await fetch(`https://djsdocs.sorta.moe/v2/embed?src=https://raw.githubusercontent.com/discordjs/discord.js/docs/master.json&q=${encodeURI(args.join())}`).then(res => res.json())
    if (!result) return message.channel.send('<@' + message.author.id + '>\n' + picker.get(locale, 'GENERAL_NO_RESULT'))
    const embed = new Discord.MessageEmbed(result)
    embed.setFooter(message.author.tag, message.author.displayAvatarURL({ format: 'png', size: 512 }))
    return message.channel.send(embed)
  }
}

module.exports = Command
