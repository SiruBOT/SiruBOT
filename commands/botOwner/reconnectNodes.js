class Command {
  constructor (client) {
    this.client = client
    this.name = 'connectnodes'
    this.aliases = ['노드연결', 'reconnectnodes', 'nodereconnect', 'nodeconnect', '채ㅜㅜㄷㅊ수ㅐㅇㄷㄴ']
    this.category = 'BOT_OWNER'
    this.requirements = {
      audioNodes: false,
      playingStatus: false,
      voiceStatus: {
        listenStatus: false,
        sameChannel: false,
        voiceIn: false
      }
    }
    this.hide = false
    this.permissions = ['BotOwner']
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    for (const node of this.client._options.audio.nodes) {
      if (!this.client.audio.getNode(node.name)) {
        message.channel.send(`${this.client._options.constructors.EMOJI_SANDCLOCK}  Reconnecting ${node.name}`)
        this.client.audio.addNode(node)
      } else {
        message.channel.send(`${this.client._options.constructors.EMOJI_YES}  Already Connected ${node.name}`)
      }
    }
  }
}

module.exports = Command
