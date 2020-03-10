class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'shuffle',
      aliases: ['셔플', '노ㅕㄹ릳'],
      category: 'MUSIC_GENERAL',
      require_voice: true,
      require_nodes: true,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message, args, guildData } = compressed
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    const all = (compressed.userPermissions.includes('DJ') || compressed.userPermissions.includes('Administarator')) && ['all', '전체', 'a', '전', '올'].includes(args[0])
    const result = await this.client.audio.queue.shuffle(message.guild.id, message.author.id, all)
    if (!result) return message.channel.send(picker.get(locale, 'COMMANDS_SHUFFLE_NO'))
    message.channel.send(picker.get(locale, all ? 'COMMANDS_SHUFFLE_ALL' : 'COMMANDS_SHUFFLE_YOUR', { NUM: result }))
  }
}

module.exports = Command
