const { requestAsync } = require('../../modules/request')
const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'docs',
      aliases: ['앷ㄴ', 'djsdocs', 'djs'],
      description: 'Discord.Js Documentation',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const { message, args } = compressed
    if (args.length === 0) return message.reply('❎  검색어를 입력해주세요!')
    const result = await requestAsync(`https://djsdocs.sorta.moe/v2/embed?src=https://raw.githubusercontent.com/discordjs/discord.js/docs/master.json&q=${args.join()}`).then(res => res.json())
    if (!result) return message.reply('❎  결과가 없어요!')
    const embed = new Discord.RichEmbed(result)
    embed.setFooter(message.author.tag, message.author.displayAvatarURL)
    message.channel.send(embed)
    // message.reply('✅  검색 결과를 찾았어요!', embed)
  }
}

module.exports = Command
