const { BaseCommand } = require('../../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'seek',
      ['점프', 'jump'],
      ['DJ', 'Administrator'],
      'MUSIC_DJ',
      {
        audioNodes: true,
        playingStatus: true,
        voiceStatus: {
          listenStatus: true,
          sameChannel: true,
          voiceIn: true
        }
      },
      [],
      false
    )
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    compressed.message.channel.send('// TODO')
    // const locale = compressed.guildData.locale
    // const picker = this.client.utils.localePicker
    // const { message, args } = compressed
  }
}

module.exports = Command
