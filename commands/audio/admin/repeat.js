class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'repeat',
      aliases: ['ㄱ덷ㅁㅅ', '반복', 'loop', 'loop'],
      category: 'MUSIC_DJ',
      require_voice: false,
      hide: false,
      permissions: ['DJ', 'Administrator']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
     * @param {Boolean} silent - if Send Message
     */
  async run (compressed) {
    const { message } = compressed
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker
    switch (compressed.GuildData.repeat) {
      case 0:
        message.channel.send(picker.get(locale, 'COMMANDS_REPEAT_ALL'))
        this.client.database.updateGuildData(message.guild.id, { $set: { repeat: 1 } })
        break
      case 1:
        message.channel.send(picker.get(locale, 'COMMANDS_REPEAT_SINGLE'))
        this.client.database.updateGuildData(message.guild.id, { $set: { repeat: 2 } })
        break
      case 2:
        message.channel.send(picker.get(locale, 'COMMANDS_REPEAT_NONE'))
        this.client.database.updateGuildData(message.guild.id, { $set: { repeat: 0 } })
        break
    }
  }
}

module.exports = Command
