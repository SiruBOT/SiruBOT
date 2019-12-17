class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'debug',
      aliases: [],
      category: 'BOT_OWNER',
      require_voice: false,
      hide: true,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const message = compressed.message
    await this.client.database.updateGlobalUserData(message.member, { $inc: { money: 100000 } })
    message.channel.send('Updated')
  }
}

module.exports = Command
