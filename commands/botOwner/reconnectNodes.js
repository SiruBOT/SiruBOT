class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'connectnodes',
      aliases: ['reconnectnodes', 'nodereconnect', 'nodeconnect', '채ㅜㅜㄷㅊ수ㅐㅇㄷㄴ'],
      category: 'BOT_OWNER',
      require_nodes: false,
      require_voice: false,
      hide: false,
      permissions: ['BotOwner']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
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
