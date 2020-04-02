const { placeHolderConstructors } = require('../../constructors')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'connectnodes',
      ['노드연결', 'reconnectnodes', 'nodereconnect', 'nodeconnect', '채ㅜㅜㄷㅊ수ㅐㅇㄷㄴ'],
      ['BotOwner'],
      'BOT_OWNER',
      {
        audioNodes: false,
        playingStatus: false,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceIn: false
        }
      },
      false
    )
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    for (const node of this.client._options.audio.nodes) {
      if (!this.client.audio.getNode(node.name)) {
        message.channel.send(`${placeHolderConstructors.EMOJI_SANDCLOCK}  Reconnecting ${node.name}`)
        this.client.audio.addNode(node)
      } else {
        message.channel.send(`${placeHolderConstructors.EMOJI_YES}  Already Connected ${node.name}`)
      }
    }
  }
}

module.exports = Command
