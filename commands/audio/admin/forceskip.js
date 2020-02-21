class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'forceskip',
      aliases: ['강제스킵', '랙ㅊㄷ나ㅑㅔ', '강제건너뛰기', 'fskip'],
      category: 'MUSIC_DJ',
      require_nodes: true,
      require_voice: true,
      hide: false,
      permissions: ['DJ', 'Administrator']
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
      this.client.audio.queue.skip(message.guild.id)
      return message.channel.send(picker.get(locale, 'COMMANDS_SKIP_SKIPPED', placeHolder))
    } else {
      return message.channel.send(picker.get(locale, 'AUDIO_NOPLAYER'))
    }
  }
}

module.exports = Command
