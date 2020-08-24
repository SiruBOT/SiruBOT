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
      const parsed = this.parseVol(args[0], guildData.volume)
      if (isNaN(parsed)) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_FORMAT'))
      if (parsed < 1) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_UNDER_ONE'))
      if (parsed > 150) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_HIGH_HDF'))
      await this.client.audio.setVolume(message.guild.id, parsed)
      message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_CHANGED', { VOLUME: parsed }))
    } else {
      const guildData = await this.client.database.getGuild(message.guild.id)
      return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_VOLUME_CURRENT', { VOLUME: guildData.volume }))
    }
  }

  isStarter (char) {
    return char === '+' || char === '-'
  }

  parseVol (string, currentVolume) {
    const starter = string.charAt(0)
    const value = +string.substr(1)
    if (!this.isValid(value)) return NaN
    switch (starter) {
      case '+':
        currentVolume += value
        break
      case '-':
        currentVolume -= value
        break
      default:
        currentVolume = value
    }
    return currentVolume
  }

  isValid (any) {
    return isFinite(any) && !isNaN(any) && Number.isInteger(any)
  }
}

module.exports = Command
