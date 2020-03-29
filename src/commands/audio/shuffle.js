class Command {
  constructor (client) {
    this.client = client
    this.name = 'shuffle'
    this.aliases = ['셔플', '노ㅕㄹ릳']
    this.category = 'MUSIC_GENERAL'
    this.requirements = {
      audioNodes: true,
      playingStatus: true,
      voiceStatus: {
        listenStatus: true,
        sameChannel: true,
        voiceIn: true
      }
    }
    this.hide = false
    this.permissions = ['Everyone']
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message, args, guildData } = compressed
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    const all = args[0] && (compressed.userPermissions.includes('DJ') || compressed.userPermissions.includes('Administarator')) && ['all', '전체', 'a', '전', '올'].includes(args[0].toLowerCase())
    const result = await this.client.audio.queue.shuffle(message.guild.id, message.author.id, all)
    if (!result) return message.channel.send(picker.get(locale, 'COMMANDS_SHUFFLE_NO'))
    message.channel.send(picker.get(locale, all ? 'COMMANDS_SHUFFLE_ALL' : 'COMMANDS_SHUFFLE_YOUR', { NUM: result }))
  }
}

module.exports = Command
