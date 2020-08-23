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

  async run ({ message, args, guildData, userPermissions }) {
    const picker = this.client.utils.localePicker
    const { locale } = guildData
    if (args.length <= 0) throw new UsageFailedError(this.name)
    if (!Number.isInteger(+args) || !isFinite(+args[0]) || isNaN(+args[0])) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_NAN'))
    if (guildData.queue.length <= 0) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_LESS_1'))
    if (+args[0] > guildData.queue.length) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_MORE_QUEUE', { SIZE: guildData.queue.length }))
    const index = +args[0] - 1
    if (!(userPermissions.includes('Administrator') || userPermissions.includes('DJ')) && guildData.queue[index].request !== message.author.id) return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_NO_PERM'))
    await Promise.all([this.client.database.updateGuild(message.guild.id, { $unset: { [`queue.${index}`]: index } }),
      this.client.database.updateGuild(message.guild.id, { $pull: { queue: null } })])
    await message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_REMOVE_REMOVED', { POSITION: index + 1, TRACK: this.client.audio.utils.formatTrack(guildData.queue[index].info) }))
  }
}

module.exports = Command
