class QueueEvents {
  constructor (client) {
    this.client = client
    this.classPrefix = '[QueueEvents'
    this.defaultPrefix = {
      HandleEvents: `${this.classPrefix}:HandleEvents]`
    }
  }

  /**
   * @param {Object} data - { op: 'trackStarted', guildID: '672586746587774976', <trackData: {}> }
   */
  HandleEvents (data) {
    switch (data.op) {
      case 'trackStarted':
        this.client.logger.debug(`${this.defaultPrefix.HandleEvents} Event from guild ${data.guildID} ${data.op} -> trackStartedEvent`)
        this.trackStartedEvent(data)
        break
      case 'playBackEnded':
        this.client.logger.debug(`${this.defaultPrefix.HandleEvents} Event from guild ${data.guildID} ${data.op} -> playBackEndedEvent`)
        this.playBackEndedEvent(data)
        break
    }
  }

  async trackStartedEvent (data) {
    const guildData = await this.client.database.getGuild(data.guildID)
    const { trackData } = data
    if (trackData.info.length <= 15000 && trackData.repeated) return
    this.client.audio.utils.sendMessage(data.guildID, this.client.utils.localePicker.get(guildData.locale, trackData.related ? 'AUDIO_NOWPLAYING_RELATED' : 'AUDIO_NOWPLAYING', { TRACK: this.client.audio.utils.formatTrack(trackData.info) }), trackData.related)
  }

  async playBackEndedEvent (data) {
    const guildData = await this.client.database.getGuild(data.guildID)
    await this.client.audio.utils.updateNowplayingMessage(data.guildID)
    await this.client.audio.utils.sendMessage(data.guildID, this.client.utils.localePicker.get(guildData.locale, 'AUDIO_ALL_SONGS_FINISHED'))
  }
}
module.exports = QueueEvents
