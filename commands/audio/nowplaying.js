class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'nowplaying',
      aliases: ['np', 'ㅞ'],
      category: 'MUSIC_GENERAL',
      require_voice: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message } = compressed
    const embed = await this.client.audio.getNowplayingEmbed(message.guild.id)
    const nowPlayingMessage = await message.channel.send(embed)
    this.client.audio.nowplayingMessages.set(message.guild.id, nowPlayingMessage)
  }
}

module.exports = Command
