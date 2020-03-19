class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'forceskip',
      aliases: ['강제건너뛰기', 'fskip', 'ㄹ나ㅑㅔ'],
      category: 'MUSIC_DJ',
      require_nodes: true,
      require_playing: true,
      require_voice: true,
      hide: false,
      permissions: ['DJ', 'Administrator']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message, guildData } = compressed
    const { locale } = guildData
    const picker = this.client.utils.localePicker
    if (!guildData.queue[0] || !guildData.nowplaying.track) return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_NOTHING_TO_SKIP'))
    if (guildData.nowplaying.track && this.client.audio.players.get(message.guild.id)) {
      const placeHolder = {
        TITLE: this.client.audio.utils.formatTrack(guildData.nowplaying.info),
        REQUEST: message.guild.members.cache.get(guildData.nowplaying.request) ? message.guild.members.cache.get(guildData.nowplaying.request).displayName : picker.get(locale, 'UNKNOWN')
      }
      this.client.audio.queue.skip(message.guild.id)
      return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
    } else {
      return message.channel.send(picker.get(locale, 'AUDIO_NOPLAYER'))
    }
  }
}

module.exports = Command
