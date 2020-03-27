class Command {
  constructor (client) {
    this.client = client
    this.name = 'scsearch'
    this.aliases = ['사클검색', 'ㄴㅊㄴㄷㅁㄱ초', 'tkzmfrjator']
    this.category = 'MUSIC_GENERAL'
    this.requirements = {
      audioNodes: true,
      playingStatus: false,
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
    return this.client.commands.get('search').run(compressed, true)
  }
}

module.exports = Command
