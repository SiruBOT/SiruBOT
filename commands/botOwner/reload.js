class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'reload',
      aliases: ['리로드', 'loadcommands', 'flfhem', 'ㄱ디ㅐㅁㅇ'],
      category: 'BOT_OWNER',
      require_nodes: false,
      require_voice: false,
      hide: false,
      permissions: ['BotOwner']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    await message.channel.send(`${this.client._options.constructors.EMOJI_YES}  모든 샤드 ${this.client.shard.count} 개에 리로드 신호를 보냅니다...`)
    await this.client.shard.broadcastEval('this.reload()')
  }
}

module.exports = Command
