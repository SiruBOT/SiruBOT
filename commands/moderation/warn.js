class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'warn',
      aliases: ['경고', 'ㅈㅁ구'],
      category: 'COMMANDS_MODERATION',
      require_voice: false,
      hide: false,
      permissions: ['Administrator']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const picker = this.client.utils.localePicker
    const { message, GuildData } = compressed
    this.client.loggerManager.send('warn', message.guild, 'Hello', 'World')
  }
}

module.exports = Command
