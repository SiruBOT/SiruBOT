const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'scsearch',
      ['사클검색', 'ㄴㅊㄴㄷㅁㄱ초', 'tkzmfrjator'],
      ['Everyone'],
      'MUSIC_GENERAL',
      {
        audioNodes: true,
        playingStatus: false,
        voiceStatus: {
          listenStatus: true,
          sameChannel: true,
          voiceIn: true
        }
      },
      false
    )
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    return this.client.commands.get('search').run(compressed, true)
  }
}

module.exports = Command
