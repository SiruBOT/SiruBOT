class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'skip',
      aliases: ['스킵', '나ㅑㅔ', '건너뛰기'],
      category: 'MUSIC_GENERAL',
      require_nodes: true,
      require_voice: true,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
     * @param {Object} compressed - Compressed Object (In CBOT)
     */
  async run (compressed) {
    const { message, GuildData } = compressed
    const { locale } = GuildData
    const picker = this.client.utils.localePicker
    if (!GuildData.queue[0] || !GuildData.nowplaying.track) return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_NOTHING_TO_SKIP'))
    if (GuildData.nowplaying.track && this.client.audio.players.get(message.guild.id)) {
      const placeHolder = { TITLE: this.client.audio.utils.formatTrack(GuildData.nowplaying.info), REQUEST: message.guild.members.cache.get(GuildData.nowplaying.request) ? message.guild.members.cache.get(GuildData.nowplaying.request).displayName : picker.get(locale, 'UNKNOWN') }
      if (GuildData.nowplaying.request === message.author.id) {
        this.client.audio.queue.skip(message.guild.id)
        return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
      } else {
        const toSkip = message.member.voice.channel.members.filter(m => !m.user.bot).size
        const skipperSize = this.client.audio.utils.addSkipper(message.guild.id, message.author.id, toSkip).length
        message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIP_REQUESTED', { TITLE: this.client.audio.utils.formatTrack(GuildData.nowplaying.info), CURRENT: skipperSize, TOSKIP: toSkip, REQUEST: message.guild.members.cache.get(GuildData.nowplaying.request) ? message.guild.members.cache.get(GuildData.nowplaying.request).displayName : picker.get(locale, 'UNKNOWN') }))
        if (this.client.audio.skippers.get(message.guild.id).size >= toSkip) {
          this.client.audio.queue.skip(message.guild.id)
          return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
        }
      }
    } else {
      return message.channel.send(picker.get(locale, 'AUDIO_NOPLAYER'))
    }
  }
}

module.exports = Command
