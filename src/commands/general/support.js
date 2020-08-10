const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'support',
      ['지원'],
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

  async run ({ message, args, prefix, userPermissions, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    const ownerName = this.client.shard ? (await this.client.shard.broadcastEval(`this.users.cache.get("${this.client._options.bot.owners[0]}") ? this.users.cache.get("${this.client._options.bot.owners[0]}").tag : false`)).filter(el => !!el)[0] : this.client.users.cache.get(this.client._options.bot.owners[0]).tag
    const embed = new Discord.MessageEmbed()
      .setColor(this.client.utils.find.getColor(message.guild.me))
      .addField(picker.get(locale, 'COMMANDS_SUPPORT_TITLE'), picker.get(locale, 'COMMANDS_SUPPORT_CONTENT', { OWNER: ownerName }))
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 512, format: 'png' }))
    message.reply(embed)
  }
}

module.exports = Command
