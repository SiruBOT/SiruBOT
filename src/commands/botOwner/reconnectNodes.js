const { placeHolderConstant } = require('../../constant')
const { BaseCommand } = require('../../structures')

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'connectnodes',
      ['노드연결', 'reconnectnodes', 'nodereconnect', 'nodeconnect'],
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
        message.channel.send(`${placeHolderConstant.EMOJI_SANDCLOCK}  Reconnecting ${node.name}`)
        this.client.audio.addNode(node)
      } else {
        message.channel.send(`${placeHolderConstant.EMOJI_YES}  Already Connected ${node.name}`)
      }
    }
  }
}

module.exports = Command
