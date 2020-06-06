const Discord = require('discord.js')
class AudioTimer {
  constructor (client, timeout) {
    this.timers = new Discord.Collection()
    this.client = client
    this.timeout = timeout
  }

  createTimer (guildId) {
    const timer = setTimeout(async () => {
      const guild = this.client.guilds.cache.get(guildId)
      if (guild.me.voice.channel && guild.me.voice.channel.members && guild.me.voice.channel.members.filter(el => !el.user.bot).filter(el => !el.voice.serverDeaf && !el.voice.selfDeaf).size <= 0) {
        const guildData = await this.client.database.getGuild(guildId || guildId)
        try {
          await this.client.audio.utils.sendMessage(
            guildId,
            this.client.utils.localePicker.get(
              guildData.locale,
              'AUDIO_PAUSED_INACTIVE'
            ),
            true
          )
          this.client.audio.stop(guildId)
          this.client.logger.debug(`[AudioTimer] Timer Ended ${this.timeout}ms ${guildId}`)
        } catch {
          this.client.logger.warn(`[AudioTimer] Failed to send TimerEndedMessage ${guildId} is channel is invalid?`)
        }
      } else {
        this.clearTimer(guildId)
      }
    }, this.timeout)
    this.timers.set(guildId, timer)
  }

  clearTimer (guildId) {
    clearTimeout(this.timers.get(guildId))
    this.timers.delete(guildId)
  }

  chkTimer (guildId) {
    const guild = this.client.guilds.cache.get(guildId)
    if (guild.me.voice.channel && guild.me.voice.channel.members && guild.me.voice.channel.members.filter(el => !el.user.bot).filter(el => !el.voice.serverDeaf && !el.voice.selfDeaf).size <= 0) {
      if (this.timers.get(guildId)) return
      this.client.logger.debug(`[AudioTimer] Timer Started ${this.timeout}ms ${guildId}`)
      this.createTimer(guildId)
    }
  }
}

module.exports = AudioTimer
