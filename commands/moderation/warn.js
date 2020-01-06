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
    message.channel.send('경고를 지급했어요!')
    this.client.loggerManager.send('warn', message.guild, message.member)
  }
}

module.exports = Command
