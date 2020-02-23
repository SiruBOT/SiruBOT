const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'help',
      aliases: ['도움', '도움말', 'ㅗ디ㅔ'],
      category: 'GENERAL_INFO',
      require_nodes: false,
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message, args, prefix, userPermissions } = compressed
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker
    const embed = new Discord.MessageEmbed()
      .setThumbnail(message.guild.me.user.displayAvatarURL)
      .setColor(this.client.utils.findUtil.getColor(message.guild.me))
      .setFooter(picker.get(locale, 'COMMANDS_HELP_FOOTER', { PREFIX: prefix }))
    const command = this.client.commands.get(args[0]) || this.client.commands.get(this.client.aliases.get(args[0]))
    if (!command || command.command.hide === true) {
      embed.setTitle(picker.get(locale, 'COMMANDS_HELP_TITLE'))
      for (const item of this.client.categories.keyArray()) {
        for (const permission of userPermissions) {
          if (this.client.utils.permissionChecker.permissions.categories.filter(el => el.category === item)[0].requiredPermissions.includes(permission)) {
            embed.addField(picker.get(locale, `CATEGORY_${item}`), '> ' + this.client.categories.get(item).map(el => `\`\`${el}\`\``).join(', '), true)
            continue
          }
        }
      }
    } else {
      embed.setTitle(picker.get(locale, 'COMMANDS_HELP_INFO', { COMMAND: command.command.name.toUpperCase() }))
      embed.setDescription(picker.get(locale, `COMMANDS_HELP_DESC_${command.command.name.toUpperCase()}`))
    }
    message.channel.send(message.author, embed)
  }
}

module.exports = Command
