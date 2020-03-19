class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'repeat',
      aliases: ['반복', 'flvlt', 'qksqhr', 'loop', 'ㅣㅐㅐㅔ', '루프'],
      category: 'MUSIC_DJ',
      require_nodes: false,
      require_playing: false,
      require_voice: false,
      hide: false,
      permissions: ['DJ', 'Administrator']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message, args, guildData } = compressed
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    const filter = { all: 0, a: 0, 전체: 0, 켜기: 0, on: 0, single: 1, s: 1, 한곡: 1, none: 2, off: 2, 끄기: 2, 없음: 2 }
    switch (this.client.utils.find.matchObj(filter, args[0], guildData.repeat)) {
      case 0:
        message.channel.send(picker.get(locale, 'COMMANDS_REPEAT_ALL'))
        this.client.database.updateGuild(message.guild.id, { $set: { repeat: 1 } })
        break
      case 1:
        message.channel.send(picker.get(locale, 'COMMANDS_REPEAT_SINGLE'))
        this.client.database.updateGuild(message.guild.id, { $set: { repeat: 2 } })
        break
      case 2:
        message.channel.send(picker.get(locale, 'COMMANDS_REPEAT_NONE'))
        this.client.database.updateGuild(message.guild.id, { $set: { repeat: 0 } })
        break
    }
  }
}

module.exports = Command
