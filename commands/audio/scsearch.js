class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'scsearch',
      aliases: ['사클검색', 'ㄴㅊㄴㄷㅁㄱ초', 'tkzmfrjator'],
      category: 'MUSIC_GENERAL',
      require_nodes: true,
      require_voice: true,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
     */
  async run (compressed) {
    return this.client.commands.get('search').run(compressed, true)
  }
}

module.exports = Command
