class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'addevent',
      aliases: ['ㅁㅇㅇㄷㅍ둣'],
      category: 'BOT_OWNER',
      require_voice: false,
      hide: false,
      permissions: ['BotOwner']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
     */
  async run (compressed) {
    const { message, args } = compressed
    await this.client.database.updateGuildData(message.guild.id, { $push: { enabledEvents: { $each: [{ name: args[0], value: args[1] }] } } })
    message.channel.send('Ok.')
  }
}

module.exports = Command
