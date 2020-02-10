class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'shutdown',
      aliases: ['셧다운'],
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
    const { message } = compressed
    const players = this.client.audio.players.size
    message.channel.send(`🛠️  종료 중...\n❎  재생중인 오디오 플레이어들 종료 중... (${players} 개)`).then(m => {
      this.client.logger.warn('[SHUTDOWN] Processing..')
      this.client.logger.warn('[SHUTDOWN] Stopping all players..')
      for (const player of this.client.audio.players.values()) {
        this.client.logger.debug(`[Shutdown] Stopping player of guild: ${player.guild}`)
        if (player.voiceConnection.guildID) this.client.audio.stop(player.voiceConnection.guildID)
      }
      m.edit(`🛠️  종료 중...\n✅  오디오 플레이어 종료 완료! (${players} 개)`)
      message.channel.send('✅  Shutting Down...').then(() => {
        this.client.logger.warn('[SHUTDOWN] Shutting Down...')
        process.exit(0)
      })
    })
  }
}

module.exports = Command
