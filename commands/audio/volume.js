class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'volume',
      aliases: ['볼륨', 'vol', 'qhffba', '패ㅣㅕㅡㄷ'],
      category: 'MUSIC_GENERAL',
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const locale = compressed.GuildData.locale
    const picker = this.client.utils.localePicker
    const { message, args } = compressed
    if ((compressed.userPermissions.includes('Administrator') || compressed.userPermissions.includes('DJ')) && args.length > 0) {
      if (isNaN(args[0])) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_STRING'))
      if (Number(args[0]) < 1) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_UNDER_ONE'))
      if (Number(args[0]) > 150) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_HIGH_HDF'))
      await this.client.audio.setVolume(message.guild, Number(args[0]))
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_CHANGED', { VOLUME: Number(args[0]) }))
    } else {
      const guildData = await this.client.database.getGuildData(message.guild.id)
      return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_CURRENT', { VOLUME: guildData.volume }))
    }
  }
}

module.exports = Command
