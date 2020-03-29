class Command {
  constructor (client) {
    this.client = client
    this.name = 'nowplaying'
    this.aliases = ['현', 'np', 'ㅞ']
    this.category = 'MUSIC_GENERAL'
    this.requirements = {
      audioNodes: true,
      playingStatus: false,
      voiceStatus: {
        listenStatus: false,
        sameChannel: false,
        voiceIn: false
      }
    }
    this.hide = false
    this.permissions = ['Everyone']
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    const embed = await this.client.audio.utils.getNowplayingEmbed(message.guild.id)
    const nowPlayingMessage = await message.channel.send(embed)
    this.client.audio.nowplayingMessages.set(message.guild.id, nowPlayingMessage)
  }
}

module.exports = Command
