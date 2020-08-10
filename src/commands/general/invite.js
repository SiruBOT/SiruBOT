const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'invite',
      ['초대'],
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

  async run ({ message, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    const embed = new Discord.MessageEmbed()
      .setColor(this.client.utils.find.getColor(message.guild.me))
      .setDescription(picker.get(locale, 'COMMANDS_INVITE_CONTENT'))
    await message.reply(embed)
  }
}

module.exports = Command
