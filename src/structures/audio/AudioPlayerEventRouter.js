const AudioPlayerEvents = require('./AudioPlayerEvents')
class AudioPlayerEventRouter {
  constructor (audio) {
    this.audio = audio
    this.client = this.audio.client
    this.classPrefix = this.audio.classPrefix + ':AudioPlayerEventRouter'
    this.defaultPrefix = {
      registerEvents: `${this.classPrefix}:registerEvents]`,
      RouteWebSocketClosedEvents: `${this.classPrefix}:RouteWebSocketClosedEvents]`,
      RouteTrackExcepetionErrors: `${this.classPrefix}:RouteTrackExcepetionErrors]`
    }
    this.AudioPlayerEvents = new AudioPlayerEvents(this)
  }

  /**
   * @param {Shoukaku#ShoukakuPlayer} player - Player for registering events
   */
  registerEvents (player) {
    this.client.logger.debug(`${this.defaultPrefix.registerEvents} Registering Player Events..`)
    player.on('end', (reason) => this.AudioPlayerEvents.onEnd(reason))
    player.on('trackException', (data) => this.AudioPlayerEvents.onEnd(data))
    player.on('error', (error) => {
      this.client.logger.error(`${this.defaultPrefix.registerEvents} Error on player ${error.stack || error.message}`)
      this.client.database.addErrorInfo('audioError', error.message, error.stack, 'bot', player.voiceConnection.guildID)
    })
    player.on('closed', (data) => this.RouteWebSocketClosedEvents(player, data))
    player.on('playerUpdate', (data) => {
      data.guildID = player.voiceConnection.guildID
      this.AudioPlayerEvents.onPlayerUpdate(data)
    })
  }

  RouteWebSocketClosedEvents (player, data) {
    this.client.logger.warn(`${this.defaultPrefix.RouteWebSocketClosedEvents} [${data.guildId}] Disconnected from websocket. ${JSON.stringify(data)}`)
    const disconnectCodes = [4014]
    if (disconnectCodes.includes(data.code) && data.byRemote === true) {
      if (data.code === disconnectCodes[0]) this.client.logger.warn(`${this.defaultPrefix.RouteWebSocketClosedEvents} [${data.guildId}] Disconnected from websocket, reconnecting...`)
      // if (data.code === disconnectCodes[1]) this.client.logger.warn(`${this.defaultPrefix.RouteWebSocketClosedEvents} [${data.guildId}] Invalid Session, reconnecting...`)
      this.client.database.getGuild(data.guildId).then((guildData) => {
        const voiceConnection = player.voiceConnection
        const { guildID, voiceChannelID, selfMute, selfDeaf } = voiceConnection
        voiceConnection.send({ guild_id: guildID, channel_id: voiceChannelID, self_deaf: selfDeaf, self_mute: selfMute })
        voiceConnection.state = 'CONNECTED'
        player.track = guildData.nowplaying.track
      })
    } else {
      player.disconnect()
    }
  }

  RouteEndEvents (data) {
    switch (data.type) {
      case 'TrackEndEvent':
        this.RouteTrackEndEventReasons(data)
        break
      case 'TrackStuckEvent':
        this.AudioPlayerEvents.TrackStuck(data)
        break
      case 'TrackExceptionEvent':
        this.RouteTrackExcepetionErrors(data)
        break
    }
  }

  RouteTrackExcepetionErrors (data) {
    this.client.logger.error(`${this.defaultPrefix.RouteTrackExcepetionErrors} Track Excepetion ${JSON.stringify(data)}`)
    this.AudioPlayerEvents.TrackExcepetion(data)
  }

  RouteTrackEndEventReasons (data) {
    switch (data.reason) {
      case 'REPLACED':
        this.AudioPlayerEvents.TrackReplaced(data)
        break
      case 'FINISHED':
        this.AudioPlayerEvents.TrackFinished(data)
        break
      case 'STOPPED':
        this.AudioPlayerEvents.TrackStopped(data)
        break
      case 'LOAD_FAILED':
        this.AudioPlayerEvents.TrackLoadFailed(data)
        break
      case 'CLEANUP':
        this.AudioPlayerEvents.TrackCleanUpped(data)
        break
    }
  }
}

module.exports = AudioPlayerEventRouter
