const Discord = require('discord.js')
class AudioTimer {
  constructor (client, timeout) {
    this.timers = new Discord.Collection()
    this.client = client
    this.timeout = timeout
  }

  chkTimer (oldState, newState) {
    if (!this.timers.get(newState.guild.id) && newState.channel && newState.member.id === this.client.user.id) {
      this.client.channels.cache.get('710151147503222855').send('Timer Started ' + this.timeout)
      const timer = setTimeout(() => {
        this.timers.delete(newState.guild.id)
        if (newState.channel.members.has(this.client.user.id) && newState.channel.members.size === 1) {
          this.client.channels.cache.get('710151147503222855').send('Timer Ended' + this.timeout)
          this.client.audio.stop(newState.guild.id, false)
        } else {
          this.chkTimer(oldState, newState)
        }
      }, this.timeout)
      this.timers.set(newState.guild.id, timer)
    }
  }
}

module.exports = AudioTimer
