const { BaseCommand } = require('../../../structures')
const { UsageFailedError } = require('../../../errors')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'settc',
      ['채널설정', 'ㄴㄷㅅㅅㅊ'],
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
    if (['none', '없음', 'null', 'remove', '지우기'].includes(args.join(' ').toLowerCase())) {
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETTC_NONE'))
      this.client.database.updateGuild(message.guild.id, { $set: { tch: '0' } })
    } else {
      const filter = (channel) => { return channel.name.toLowerCase() === args.join(' ').toLowerCase() || channel.id === args.join(' ') || channel.id === (message.mentions.channels.array()[0] === undefined ? false : message.mentions.channels.array()[0].id) }
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
