class Event {
  constructor (client) {
    this.client = client
    this.name = 'voiceStateUpdate'
    this.listener = (...args) => this.run(...args)
  }

  /**
     * Run Event
     */
  async run (oldState, newState) {
    this.client.audio.audioTimer.chkTimer(oldState.guild.id || newState.guild.id)
  }
}
module.exports = Event
