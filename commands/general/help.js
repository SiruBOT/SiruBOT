const Discord = require('discord.js')

class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'help',
      aliases: ['도움', '명령어', 'ehdna', 'audfuddj', 'cmds', 'cmdlist'],
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
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker
    const embed = new Discord.MessageEmbed()
      .setThumbnail(message.guild.me.user.displayAvatarURL({ format: 'png', size: 512 }))
      .setColor(this.client.utils.find.getColor(message.guild.me))
      .setFooter(picker.get(locale, 'COMMANDS_HELP_FOOTER', { PREFIX: prefix }))
    const command = this.client.commands.get(args[0]) || this.client.commands.get(this.client.aliases.get(args[0]))
    if (!command || command.command.hide === true) {
      embed.setTitle(picker.get(locale, 'COMMANDS_HELP_TITLE'))
      for (const item of this.client.categories.keyArray()) {
        for (const permission of userPermissions) {
          if (this.client.utils.permissionChecker.permissions.categories.filter(el => el.category === item)[0].requiredPermissions.includes(permission)) {
            embed.addFields({ name: '**' + picker.get(locale, `CATEGORY_${item}`) + '**', value: this.client.categories.get(item).map(el => `\`\`${el}\`\``).join(', '), inline: false })
            continue
          }
        }
      }
    } else {
      const commandInfo = command.command
      embed.setTitle(picker.get(locale, 'COMMANDS_HELP_INFO', { COMMAND: commandInfo.name.toUpperCase() }), message.guild.me.user.displayAvatarURL({ format: 'png', size: 512 }))
      embed.addFields(
        {
          name: picker.get(locale, 'COMMANDS_HELP_DESC'),
          value: `\`\`\`fix\n${picker.get(locale, `DESC_${commandInfo.category.toUpperCase()}_${commandInfo.name.toUpperCase()}`)}\`\`\``
        },
        {
          name: picker.get(locale, 'COMMANDS_HELP_USAGE'),
          value: `\`\`\`fix\n${picker.get(locale, `USAGE_${commandInfo.category.toUpperCase()}_${commandInfo.name.toUpperCase()}`, { COMMAND: commandInfo.name })}\`\`\``
        },
        {
          name: picker.get(locale, 'COMMANDS_HELP_ALIASES'),
          value: commandInfo.aliases.length === 0 ? picker.get(locale, 'NONE') : commandInfo.aliases.map(el => `\`\`${Discord.Util.escapeMarkdown(el)}\`\``).join(', ')
        }
      )
    }
    message.channel.send(message.author, embed)
  }
}

module.exports = Command
