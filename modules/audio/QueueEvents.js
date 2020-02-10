const Discord = require('discord.js')
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
    const guildData = await this.client.database.getGuildData(data.guildID)
    const { trackData } = data
    this.client.audio.utils.sendMessage(data.guildID, this.client.utils.localePicker.get(guildData.locale, 'AUDIO_NOWPLAYING', { TRACK: Discord.Util.escapeMarkdown(trackData.info.title), DURATION: this.client.utils.timeUtil.toHHMMSS(trackData.info.length / 1000, trackData.info.isStream) }))
  }

  async playBackEndedEvent (data) {
    const guildData = await this.client.database.getGuildData(data.guildID)
    this.client.audio.utils.sendMessage(data.guildID, this.client.utils.localePicker.get(guildData.locale, 'AUDIO_ALL_SONGS_FINISHED'))
  }
}
module.exports = QueueEvents
