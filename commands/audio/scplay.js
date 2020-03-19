class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'scplay',
      category: 'MUSIC_GENERAL',
      require_nodes: true,
      require_playing: false,
      require_voice: true,
      hide: false,
      aliases: ['사클재생', 'ㄴㅊㅔㅣ묘', 'scp', 'tkzmfwotod'],
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    this.client.commands.get('play').run(compressed, true)
  }
}

module.exports = Command
