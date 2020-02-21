class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'shuffle',
      aliases: ['노ㅕㄹ릳', '셔플'],
      category: 'MUSIC_GENERAL',
      require_voice: false,
      require_nodes: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message } = compressed
  }
}

module.exports = Command
