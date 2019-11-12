const fetch = require('node-fetch')
const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'docs',
      aliases: ['앷ㄴ', 'djsdocs', 'djs'],
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker
    const { message, args } = compressed
    if (args.length === 0) return message.reply(picker.get(locale, 'GENERAL_INPUT_QUERY'))
    const result = await fetch(`https://djsdocs.sorta.moe/v2/embed?src=https://raw.githubusercontent.com/discordjs/discord.js/docs/master.json&q=${args.join()}`).then(res => res.json())
    if (!result) return message.reply(picker.get(locale, 'GENERAL_NO_RESULT'))
    const embed = new Discord.RichEmbed(result)
    embed.setFooter(message.author.tag, message.author.displayAvatarURL)
    message.channel.send(embed)
  }
}

module.exports = Command
