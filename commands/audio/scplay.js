class Command {
  constructor (client) {
    this.client = client
    this.name = 'scplay'
    this.aliases = ['사클재생', 'ㄴㅊㅔㅣ묘', 'scp', 'tkzmfwotod']
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
    this.client.commands.get('play').run(compressed, true)
  }
}

module.exports = Command
