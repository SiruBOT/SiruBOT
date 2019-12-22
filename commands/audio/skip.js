class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'skip',
      aliases: ['건너뛰기', '나ㅑㅔ'],
      category: 'MUSIC_GENERAL',
      require_voice: true,
      hide: false,
      permissions: ['Administrator', 'DJ']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
     */
  async run (compressed) {
    const { message } = compressed
    this.client.audio.players.get(message.guild.id).skipTrack()
    message.channel.send('Skipped ``1`` Track.')
  }

  checkIfSkipable (message) {
  }
}

module.exports = Command
