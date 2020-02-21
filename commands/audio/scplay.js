class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'scplay',
      category: 'MUSIC_GENERAL',
      require_nodes: true,
      require_voice: true,
      hide: false,
      aliases: ['ㄴㅊㅔㅣ묘'],
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    this.client.commands.get('play').run(compressed, true)
  }
}

module.exports = Command
