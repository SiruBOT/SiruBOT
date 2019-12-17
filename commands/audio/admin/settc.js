class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'settc',
      aliases: ['ㄴㄷㅅㅅㅊ'],
      category: 'MUSIC_DJ',
      require_voice: false,
      hide: false,
      permissions: ['Administrator', 'DJ']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
  }
}

module.exports = Command
