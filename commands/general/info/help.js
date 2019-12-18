const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'help',
      aliases: ['도움', '도움말', 'ㅗ디ㅔ'],
      category: 'COMMANDS_GENERAL_INFO',
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  run (compressed) {
    const { message, args, prefix } = compressed
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker
    const embed = new Discord.RichEmbed()
      .setThumbnail(message.guild.me.user.displayAvatarURL)
      .setColor(this.client.utils.findUtil.getColor(message.member))
      .setFooter(picker.get(locale, 'COMMANDS_HELP_FOOTER', { PREFIX: prefix }))
    const command = this.client.commands.get(args[0]) || this.client.commands.get(this.client.aliases.get(args[0]))
    if (!command || command.command.hide === true) {
      embed.setTitle(picker.get(locale, 'COMMANDS_HELP_TITLE'))
      for (const item of this.client.categories.keyArray()) {
        embed.addField(picker.get(locale, `CATEGORY_${item}`), this.client.categories.get(item).map(el => `\`\`${el}\`\``).join(', '))
      }
    } else {
      embed.setTitle(picker.get(locale, 'COMMANDS_HELP_INFO', { COMMAND: command.command.name.toUpperCase() }))
      embed.addField(picker.get(locale, `COMMANDS_HELP_DESC_${command.command.name.toUpperCase()}`))
    }
    message.channel.send(message.author, embed)
  }
}

module.exports = Command
