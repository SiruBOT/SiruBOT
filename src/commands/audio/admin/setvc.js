const { BaseCommand } = require('../../../structures')
const { UsageFailedError } = require('../../../errors')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'setvc',
      ['음성채널설정', 'ㄴㄷㅅㅍㅊ'],
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

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run ({ message, args, guildData }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    if (args.length <= 0) throw new UsageFailedError(this.name)
    const findToString = args.join(' ').toLowerCase()
    if (['none', '없음', 'null', 'remove', '지우기'].includes(findToString.toLowerCase())) {
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETVC_NONE'))
      this.client.database.updateGuild(message.guild.id, { $set: { vch: '0' } })
    } else {
      const filter = (channel) => {
        return channel.name.toLowerCase() === findToString.toLowerCase() ||
        channel.id === findToString
      }
      const options = {
        title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
        formatter: this.client.utils.find.formatters.channel,
        collection: message.guild.channels.cache.filter(el => el.type === 'voice'),
        filter: filter,
        message: message,
        locale: locale,
        picker: picker
      }
      const res = await this.client.utils.find.findElement(options)
      if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETVC_SET', { CHANNEL: `<#${res.id}>` }))
      this.client.database.updateGuild(message.guild.id, { $set: { vch: res.id } })
    }
  }
}

module.exports = Command
