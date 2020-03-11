class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'shutdown',
      aliases: ['셧다운'],
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
    message.channel.send(`📫  모든 샤드 ${this.client.shard.count} 개에 종료 신호를 보냅니다...`)
    this.client.shard.broadcastEval('this.shutdown()').then(results => {
      for (const shardID of results) {
        message.channel.send(`${this.client._options.constructors.EMOJI_YES}  샤드 ${shardID} 번의 종료가 시작되었습니다.`)
      }
    })
  }
}

module.exports = Command
