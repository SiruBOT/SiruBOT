const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'volume',
      ['볼륨', '볼륨설정', 'vol', 'v'],
      ['Everyone'],
      'MUSIC_GENERAL',
      {
        audioNodes: true,
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

  async run ({ message, args, guildData, userPermissions }) {
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    if ((userPermissions.includes('Administrator') || userPermissions.includes('DJ')) && args.length > 0) {
      if (isNaN(args[0])) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_STRING'))
      if (Number(args[0]) < 1) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_UNDER_ONE'))
      if (Number(args[0]) > 150) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_HIGH_HDF'))
      await this.client.audio.setVolume(message.guild.id, Number(args[0]))
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_CHANGED', { VOLUME: Number(args[0]) }))
    } else {
      const guildData = await this.client.database.getGuild(message.guild.id)
      return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_CURRENT', { VOLUME: guildData.volume }))
    }
  }
}

module.exports = Command
