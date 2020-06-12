const { BaseCommand } = require('../../../structures')
const { UsageFailedError } = require('../../../errors')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'setdj',
      ['dj설정', 'ㄴㄷㅅ어'],
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
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    if (args.length <= 0) throw new UsageFailedError(this.name)
    const findToString = args.join(' ').toLowerCase()
    if (['none', '없음', 'null', 'remove', '지우기'].includes(findToString.toLowerCase())) {
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETDJ_NONE'))
      this.client.database.updateGuild(message.guild.id, { $set: { dj_role: '0' } })
    } else {
      const filter = (role) => {
        return role.name.toLowerCase() === findToString ||
        role.name.replace('@everyone', 'everyone') === findToString.replace('@everyone', 'everyone') ||
        role.id === (message.mentions.roles.first() ? message.mentions.roles.first().id : null)
      }
      const options = {
        title: picker.get(locale, 'PAGER_MULTIPLE_ITEMS'),
        formatter: this.client.utils.find.formatters.role,
        collection: message.guild.roles.cache,
        filter: filter,
        message: message,
        locale: locale,
        picker: picker
      }
      const res = await this.client.utils.find.findElement(options)
      if (!res) return options.message.channel.send(options.picker.get(options.locale, 'GENERAL_NO_RESULT'))
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETDJ_SET', { DJNAME: res.name }))
      this.client.database.updateGuild(message.guild.id, { $set: { dj_role: res.id } })
    }
  }
}

module.exports = Command
