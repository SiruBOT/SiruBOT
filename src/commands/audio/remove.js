const { BaseCommand } = require('../../structures')
const { UsageFailedError } = require('../../errors')

class Command extends BaseCommand {
  constructor (client) {
    super(
      client,
      'remove',
      ['제거', '지우기', 'rm'],
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
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    if (args.length <= 0) throw new UsageFailedError(this.name)
    if (+args[0] <= 0 || !Number.isInteger(+args[0]) || !isFinite(+args[0]) || isNaN(+args[0])) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_NAN'))
    if (guildData.queue.length <= 0) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_QUEUE_LESS'))
    if (+args[0] <= 0) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_NEGATIVE'))
    if (+args[0] > guildData.queue.length) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_MORE_QUEUE', { SIZE: guildData.queue.length }))
    const index = +args[0] - 1
    if (!(userPermissions.includes('Administrator') || userPermissions.includes('DJ')) && guildData.queue[index].request !== message.author.id) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_NO_PERM'))
    await this.client.database.updateGuild(message.guild.id, [ // "Cheat Sheet" https://stackoverflow.com/a/62551740
      {
        $set: {
          queue: {
            $concatArrays: [
              { $slice: ['$queue', index] },
              { $slice: ['$queue', { $add: [1, index] }, { $size: '$queue' }] }
            ]
          }
        }
      }
    ])
    await message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_REMOVED', { POSITION: index + 1, TRACK: this.client.audio.utils.formatTrack(guildData.queue[index].info) }))
  }
}

module.exports = Command
