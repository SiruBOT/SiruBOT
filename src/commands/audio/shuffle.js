const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'shuffle',
      ['셔플'],
      ['Everyone'],
      'MUSIC_GENERAL',
      {
        audioNodes: true,
        playingStatus: true,
        voiceStatus: {
          listenStatus: true,
          sameChannel: true,
          voiceIn: true
        }
      },
      false
    )
  }

  async run ({ message, args, guildData, userPermissions }) {
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    const all = args[0] && (userPermissions.includes('DJ') || userPermissions.includes('Administarator')) && ['all', '전체', 'a', '전', '올'].includes(args[0].toLowerCase())
    const result = await this.client.audio.queue.shuffle(message.guild.id, message.author.id, all)
    if (!result) return message.channel.send(picker.get(locale, 'COMMANDS_SHUFFLE_NO'))
    message.channel.send(picker.get(locale, all ? 'COMMANDS_SHUFFLE_ALL' : 'COMMANDS_SHUFFLE_YOUR', { NUM: result }))
  }
}

module.exports = Command
