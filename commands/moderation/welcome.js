const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'welcome',
      aliases: ['환영', 'ㅈ디채ㅡㄷ'],
      category: 'MODERATION',
      require_nodes: false,
      require_playing: false,
      require_voice: false,
      hide: false,
      permissions: ['Administrator']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const getName = this.client.commands.get('settings').getName
    const picker = this.client.utils.localePicker
    const locale = compressed.guildData.locale
    const { message, args, command, guildData } = compressed
    const responds = {}
    // View: 0, Set: 1, Remove: 2
    const method = this.client.utils.find.matchObj({ view: 'view', set: 'set', remove: 'remove', 보기: 'view', 설정: 'set', 지우기: 'remove' }, args.shift(), null)
    // Enter: 0, Leave: 1
    const type = this.client.utils.find.matchObj({ 잘가: 'bye', 환영: 'welcome', 입장: 'welcome', 퇴장: 'bye', welcome: 'welcome', bye: 'bye' }, args.shift(), null)
    if (!method || !type) return message.channel.send('No Method or Type')
    else {
      if (method === 'view') {
        const welcomeData = guildData[type]
        const embed = new Discord.MessageEmbed()
        embed.setColor(this.client.utils.find.getColor(message.guild.me))
        embed.setTitle(picker.get(locale, `COMMANDS_WELCOME_${type.toUpperCase()}_STATUS`))
        embed.setDescription(picker.get(locale, `COMMANDS_WELCOME_${type.toUpperCase()}_ENABLE`, { TEXTSTATUS: picker.get(locale, 'ENABLE') }))
        message.channel.send(embed)
      }
      message.channel.send(`${method}, ${type}`)
    }
  }
}

module.exports = Command
