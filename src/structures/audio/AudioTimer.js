const Discord = require('discord.js')
class AudioTimer {
  constructor (client, timeout) {
    this.timers = new Discord.Collection()
    this.client = client
    this.timeout = timeout
  }

  chkTimer (oldState, newState) {
    if (!this.timers.get(newState.guild.id) && newState.channel && newState.member.id === this.client.user.id) {
      this.client.logger.debug(`[AudioTimer] Timer Started ${this.timeout}ms ${newState.guild.id}`)
      const timer = setTimeout(async () => {
        this.timers.delete(newState.guild.id)
        if (newState.channel && newState.channel.members && newState.channel.members.filter(el => !el.user.bot).filter(el => !el.voice.serverDeaf && !el.voice.selfDeaf).size <= 0) {
          this.client.audio.stop(newState.guild.id, false)
          const guildData = await this.client.database.getGuild(newState.guild.id || oldState.guild.id)
          this.client.audio.utils.sendMessage(
            newState.guild.id || oldState.guild.id,
            this.client.utils.localePicker.get(
              guildData.locale,
              'AUDIO_PAUSED_INACTIVE'
            ),
            true
          )
          this.client.logger.debug(`[AudioTimer] Timer Ended ${this.timeout}ms ${newState.guild.id}`)
        } else {
          clearTimeout(this.timers.get(newState.guild.id))
          this.chkTimer(oldState, newState)
        }
      }, this.timeout)
      this.timers.set(newState.guild.id, timer)
    }
  }
}

module.exports = AudioTimer
