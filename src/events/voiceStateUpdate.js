const { BaseEvent } = require('../structures')

class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'voiceStateUpdate',
      (...args) => this.run(...args)
    )
  }

  /**
   * Run Event
   */
  async run (oldState, newState) {
    this.client.audio.audioTimer.chkTimer(oldState.guild.id || newState.guild.id)
  }
}
module.exports = Event
