const { BaseCommand } = require('../../../structures')
const { UsageFailedError } = require('../../../errors')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'settc',
      ['채널설정'],
      ['Administrator'],
      'MODERATION',
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
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    if (args.length <= 0) throw new UsageFailedError(this.name)
    const findToString = args.join(' ').toLowerCase()
    if (['none', '없음', 'null', 'remove', '지우기'].includes(findToString.toLowerCase())) {
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETTC_NONE'))
      this.client.database.updateGuild(message.guild.id, { $set: { tch: '0' } })
    } else {
      const filter = (channel) => {
        return channel.name.toLowerCase() === findToString.toLowerCase() ||
        channel.id === findToString ||
        channel.id === (message.mentions.channels.first() ? message.mentions.channels.first().id : null)
      }
      const options = {
        title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
        formatter: this.client.utils.find.formatters.channel,
        collection: message.guild.channels.cache.filter((el) => el.type === 'text'),
        filter: filter,
        message: message,
        locale: locale,
        picker: picker
      }
      const res = await this.client.utils.find.findElement(options)
      if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETTC_SET', { CHANNEL: `<#${res.id}>` }))
      this.client.database.updateGuild(message.guild.id, { $set: { tch: res.id } })
    }
  }
}

module.exports = Command
