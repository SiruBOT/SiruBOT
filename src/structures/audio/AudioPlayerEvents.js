const AudioUtils = require('./AudioUtils')
const { decodeTrack } = require('lavaplayer-track-info')
const Sentry = require('@sentry/node')
class AudioPlayerEvents {
  constructor (Router) {
    this.router = Router
    this.client = Router.client
    this.audioUtils = new AudioUtils(this.client)
    this.classPrefix = this.router.classPrefix + ':AudioPlayerEvents'
    this.defaultPrefix = {
      onEnd: `${this.classPrefix}:onEnd]`,
      TrackFinished: `${this.classPrefix}:TrackFinished]`,
      TrackReplaced: `${this.classPrefix}:TrackReplaced]`,
      TrackLoadFailed: `${this.classPrefix}:TrackLoadFailed]`,
      TrackStopped: `${this.classPrefix}:TrackStopped]`,
      TrackExcepetion: `${this.classPrefix}:TrackExcepetion]`,
      onPlayerUpdate: `${this.classPrefix}:onPlayerUpdate]`,
      onWebSocketClosed: `${this.classPrefix}:onWebSocketClosed]`
    }
  }

  /**
   * Player Update
   */
  onPlayerUpdate (data) {
    this.client.logger.debug(`${this.defaultPrefix.onPlayerUpdate} [${data.guildID}] Update Database... { position: ${data.position} }`)
    this.client.audio.audioTimer.chkTimer(data.guildID)
    this.client.database.updateGuild(data.guildID, { $set: { nowplayingPosition: data.position || 0 } })
    this.client.audio.utils.updateNowplayingMessage(data.guildID)
  }

  /**
   * @param {*}
   */
  onWebSocketClosed (reason) {
    this.client.logger.debug(`${this.defaultPrefix.onWebSocketClosed} [${reason.guildId}] Audio Websocket ${reason.reason}, (Code: ${reason.code}, byRemote: ${reason.byRemote})`)
    this.router.RouteWebSocketClosedEvents(reason)
  }

  /**
   * TrackEndEvents
   */
  onEnd (data) {
    this.client.logger.debug(`${this.defaultPrefix.onEnd} ${JSON.stringify(data)} -> RouteEndEvents`)
    this.client.logger.debug(`${this.defaultPrefix.onEnd} Update [${data.guildId}]'s nowplaying '0'`)
    this.client.database.updateGuild(data.guildId, { $set: { nowplayingPosition: 0 } })
    this.router.RouteEndEvents(data)
  }

  TrackCleanUpped (data) {
    this.client.logger.debug(`${this.defaultPrefix.TrackStopped} [${data.guildId}] Cleaned Track (Maybe session invalid)`)
    this.client.audio.queue.autoPlay(data.guildId, true)
  }

  TrackStopped (data) {
    this.client.logger.debug(`${this.defaultPrefix.TrackStopped} [${data.guildId}] Stopped Track (Maybe Skip) [${data.track}]`)
    this.client.audio.queue.deQueue(data.guildId, true)
  }

  TrackFinished (data) {
    this.client.logger.debug(`${this.defaultPrefix.TrackFinished} [${data.guildId}] Finished Track [${data.track}]`)
    this.client.audio.queue.deQueue(data.guildId)
  }

  TrackReplaced (data) {
    this.client.logger.debug(`${this.defaultPrefix.TrackReplaced} [${data.guildId}] Replaced Track [${data.track}]`)
  }

  TrackLoadFailed (data) {
    this.client.logger.debug(`${this.defaultPrefix.TrackLoadFailed} [${data.guildId}] Failed to load track [${data.track}]`)
    this.client.audio.queue.deQueue(data.guildId, true)
  }

  /**
   * End of TrackEndEvents
   */

  TrackStuck (data) {
    this.client.logger.debug(`${this.defaultPrefix.TrackLoadFailed} [${data.guildId}] Track Stucked [${data.track}]`)
    this.client.audio.queue.deQueue(data.guildId, true, true)
  }

  async TrackExcepetion (data) {
    this.client.logger.debug(`${this.defaultPrefix.TrackLoadFailed} [${data.guildId}] Track Excepetion [${data.track}]`)
    try {
      const { track } = data
      if (data.error) Sentry.captureException(new Error(`Failed to play track ${data.track}\n${data.error}`))
      if (!track) return
      const guildData = await this.client.database.getGuild(data.guildId)
      const picker = this.client.utils.localePicker
      const { locale } = guildData
      await this.audioUtils.sendMessage(data.guildId, picker.get(locale, 'AUDIO_TRACK_EXCEPETION', { TRACK: this.audioUtils.formatTrack(decodeTrack(track)), ERROR: data.error ? data.error : '' }), true)
    } catch (e) {
      Sentry.captureException(e)
      this.client.logger.error(`${this.defaultPrefix.TrackExcepetion} Failed to handle trackExcepetion in guild ${data.guildId}\n${e.stack || e.message || e}`)
    }
  }
}
module.exports = AudioPlayerEvents
