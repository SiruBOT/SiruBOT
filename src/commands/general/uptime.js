const Discord = require('discord.js')
const { BaseCommand } = require('../../structures')
const moment = require('moment')
const os = require('os')
require('moment-duration-format')(moment)

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'uptime',
      ['업타임'],
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
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    const shardUptime = moment.duration(this.client.uptime, 'milliseconds').format(picker.get(locale, 'DURATION_FORMAT'))
    const systemUptime = moment.duration(os.uptime(), 'seconds').format(picker.get(locale, 'DURATION_FORMAT'))
    const lastReady = moment(this.client.readyTimestamp).tz(this.client._options.timeZone).locale(locale).format('LLL')
    const embed = new Discord.MessageEmbed()
      .setColor(this.client.utils.find.getColor(message.guild.me))
      .setThumbnail(this.client.user.displayAvatarURL({ size: 256, dynamic: true }))
      .addField(picker.get(locale, 'COMMANDS_UPTIME_SHARD'), shardUptime)
      .addField(picker.get(locale, 'COMMANDS_UPTIME_HOST'), systemUptime)
      .setFooter(picker.get(locale, 'COMMANDS_LAST_READY') + ' • ' + lastReady)
    await message.reply(embed)
  }
}

module.exports = Command
