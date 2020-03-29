const { BaseCommand } = require('../../../structures')

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

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const picker = this.client.utils.localePicker
    const locale = compressed.guildData.locale
    const { message, args } = compressed
    if (['none', '없음', 'null', 'remove', '지우기'].includes(args.shift().toLowerCase())) {
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_SETDJ_NONE'))
      this.client.database.updateGuild(message.guild.id, { $set: { dj_role: '0' } })
    } else {
      const filter = (role) => { return role.name.toLowerCase() === args.join(' ').toLowerCase() || role.id === args.join(' ') || role.name.replace('@everyone', 'everyone') === args.join(' ').toLowerCase().replace('@', '') || role.id === (message.mentions.roles.array()[0] === undefined ? false : message.mentions.roles.array()[0].id) }
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
