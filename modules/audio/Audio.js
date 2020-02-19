const Shoukaku = require('shoukaku')
const NodeCache = require('node-cache')
const Queue = require('./Queue')
const AudioPlayerEventRouter = require('./AudioPlayerEventRouter')
const AudioUtils = require('./AudioUtils')
const QueueEvents = require('./QueueEvents')
const { Collection } = require('discord.js')

class Audio extends Shoukaku.Shoukaku {
  constructor (...args) {
    super(...args)

    this.client = args[0]

    this.utils = new AudioUtils(this.client)

    this.classPrefix = '[Audio:Defalut'
    this.lavalinkPrefix = '[Audio:Lavalink]'
    this.defaultPrefix = {
      getTrack: `${this.classPrefix}:getTrack]`,
      join: `${this.classPrefix}:join]`,
      moveChannel: `${this.classPrefix}:moveChannel]`,
      leave: `${this.classPrefix}:leave]`,
      stop: `${this.classPrefix}:stop]`,
      handleDisconnect: `${this.classPrefix}:handleDisconnect]`,
      setPlayerDefaultSetting: `${this.classPrefix}:setPlayerDefaultSetting]`,
      setVolume: `${this.classPrefix}:setVolume]`
    }

    this.queue = new Queue(this)
    const queueEvents = new QueueEvents(args[0])
    this.queue.on('queueEvent', (data) => {
      queueEvents.HandleEvents(data)
    })
    this.textChannels = new Collection()
    this.textMessages = new Collection()
    this.nowplayingMessages = new Collection()
    this.skippers = new Collection()

    this.audioRouter = new AudioPlayerEventRouter(this)

    this.client.logger.info(`${this.classPrefix}] Init Audio..`)
    this.trackCache = new NodeCache({ ttl: 500 })

    this.on('ready', (name, resumed) => this.client.logger.info(`${this.lavalinkPrefix} Lavalink Node: ${name} is now connected. This connection is ${resumed ? 'resumed' : 'a new connection'}`))
    this.on('error', (name, error) => this.client.logger.error(`${this.lavalinkPrefix} Lavalink Node: ${name} emitted an error. ${error.stack}`))
    this.on('close', (name, code, reason) => this.client.logger.warn(`${this.lavalinkPrefix} Lavalink Node: ${name} closed with code ${code}. Reason: ${reason || 'No reason'}`))
    this.on('disconnected', (name, reason) => this.client.logger.warn(`${this.lavalinkPrefix} Lavalink Node: ${name} disconnected. Reason: ${reason || 'No reason'}`))
    this.on('debug', (name, data) => {
      this.client.logger.debug(`${this.lavalinkPrefix} Lavalink Node: ${name} - Data: ${JSON.stringify(data)}`)
    })
  }

  /**
   * @param {String} voiceChannelID - voiceChannelId join for
   * @param {String} guildID - guildID of voiceChannel
   */
  join (voiceChannelID, guildID, moveChannel = false) {
    return new Promise((resolve, reject) => {
      this.getNode().joinVoiceChannel({
        guildID: guildID,
        voiceChannelID: voiceChannelID
      }).then((player) => {
        this.audioRouter.registerEvents(player)
        this.setPlayersDefaultSetting(guildID)
        this.client.logger.debug(`${this.defaultPrefix.join} [${guildID}] [${voiceChannelID}] Successfully joined voiceChannel.`)
        if (!moveChannel) this.queue.autoPlay(guildID)
        resolve(true)
      }).catch(e => {
        this.client.guilds.cache.get(guildID)
        this.client.logger.error(`${this.defaultPrefix.join} [${guildID}] [${voiceChannelID}] Failed to join voiceChannel [${e.name}: ${e.message}]`)
        reject(e)
      })
    })
  }

  /**
  * @param {String} guildID - guildID
  * @example - <Audio>.setPlayerDefaultSetting('672586746587774976')
  * @returns {Promise<Boolean>}
  */
  async setPlayersDefaultSetting (guildID) {
    if (!guildID) return new Error('no guildID Provied')
    const { volume } = await this.client.database.getGuild(guildID)
    this.client.logger.debug(`${this.defaultPrefix.setPlayerDefaultSetting} Set player volume for guild ${guildID} (${volume})`)
    return this.players.get(guildID).setVolume(volume)
  }

  /**
   * @param {String} guildID - guildID for player leave
   */
  leave (guildID) {
    this.client.logger.debug(`${this.defaultPrefix.leave} [${guildID}] Player leave`)
    if (this.players.get(guildID)) this.players.get(guildID).disconnect()
    else {
      for (const node of this.nodes.values()) {
        node.leaveVoiceChannel(guildID)
      }
    }
  }

  /**
   * @param {String} guildID - guildID for player stop
   * @param {Boolean} cleanQueue - if clears Tracks Queue
   */
  stop (guildID, cleanQueue = true) {
    if (!guildID) return new Error('guildID is not provied')
    this.leave(guildID)
    if (cleanQueue) this.client.database.updateGuild(guildID, { $set: { queue: [] } })
    this.queue.setNowPlaying(guildID, { track: null })
    this.client.database.updateGuild(guildID, { $set: { nowplayingPosition: 0 } })
    this.client.audio.utils.updateNowplayingMessage(guildID)
  }

  /**
   * @param {String} guildId - guildId to set volume
   * @param {Number} volume - Percentage of volume (0~150)
   * @example - <Audio>.setVolume('672586746587774976', 150)
   */
  setVolume (guildID, vol) {
    this.client.logger.debug(`${this.defaultPrefix.setVolume} Setting volume of guild ${guildID} to ${vol}..`)
    this.client.database.updateGuild(guildID, { $set: { volume: vol } })
    if (!this.players.get(guildID)) return Promise.resolve(false)
    else {
      this.players.get(guildID).setVolume(vol)
    }
  }

  /**
   * @param {Object} data - Socket Data
   */
  async handleDisconnect (data) {
    this.client.logger.debug(`${this.defaultPrefix.handleDisconnect} Reconnect voicechannel...`)
    if (this.client.guilds.cache.get(data.guildId).me.voice.channelID) {
      this.players.get(data.guildId).disconnect()
      const guildData = await this.client.database.getGuild(data.guildId)
      this.join(this.client.guilds.cache.get(data.guildId).me.voice.channelID, data.guildId).then(async () => {
        if (guildData.nowplaying.track !== null) await this.players.get(data.guildId).playTrack(guildData.nowplaying.track, { noReplace: false, startTime: guildData.nowplayingPosition || 0 })
      }).catch((e) => {
        this.client.logger.error(`${this.defaultPrefix.handleDisconnect} ${e.name}: ${e.message} Stack Trace:\n${e.stack}`)
        this.client.logger.debug(`${this.defaultPrefix.handleDisconnect} Handle DisconnectHandler Error, Stops Audio Queue, Sets nowplaying is null...`)
        this.stop(data.guildId)
      })
    }
  }

  /**
   * @param {String} guildID - guild Id of voicechannel for move
   * @param {String} channelID - channelID to moving
   * @returns {Promise<true|Error>}
   */
  moveChannel (voiceChannelID, guildID) {
    return new Promise((resolve, reject) => {
      if (!this.players.get(guildID)) return resolve(this.join(voiceChannelID, guildID))
      const beforePlayer = this.players.get(guildID)
      const beforeObject = clone({
        voiceChannel: (!beforePlayer.voiceConnection ? null : beforePlayer.voiceConnection.voiceChannelID),
        volume: (!beforePlayer ? 100 : beforePlayer.volume),
        track: (!beforePlayer ? null : beforePlayer.track),
        position: (!beforePlayer ? 0 : beforePlayer.position),
        paused: (!beforePlayer ? false : beforePlayer.paused)
      })
      if (beforeObject.voiceChannel === voiceChannelID) return reject(new Error('voiceChannel cannot be the same as the player\'s voiceChannel.'))
      this.leave(guildID)
      this.join(voiceChannelID, guildID, true).then(async () => {
        if (beforeObject.track) await this.players.get(guildID).playTrack(beforeObject.track, { noReplace: false, startTime: beforeObject.position })
        if (beforeObject.volume) this.players.get(guildID).setVolume(beforeObject.volume)
        if (beforeObject.paused) await this.players.get(guildID).setPaused(beforeObject.paused)
        this.client.logger.debug(`${this.defaultPrefix.moveChannel} [${guildID}] [${beforeObject.voiceChannel}] -> [${voiceChannelID}] Successfully moved voiceChannel.`)
        resolve(true)
      }).catch(e => {
        this.client.logger.error(`${this.defaultPrefix.moveChannel} [${guildID}] [${beforeObject.voiceChannel}] -> [${voiceChannelID}] Failed move to voiceChannel [${e.name}: ${e.message}]`)
        reject(e)
      })
    })
  }

  /**
   * @description - Get Nodes sort by players.
   */
  getNode (name = undefined) {
    const Arr = Array.from(this.client.audio.nodes.values()).filter(el => el.state === 'CONNECTED')
    if (!name || this.client.audio.nodes.get(name)) return Arr.sort((a, b) => { return a.players.size - b.players.size })[0]
    else {
      this.client.audio.nodes.get(name)
    }
  }

  /**
   * @param {String} query - Search String ('ytsearch: asdfmovie')
   * @returns {Promise<Object>} - query Result (Promise)
   */
  async getTrack (query, cache = true) {
    if (!query) return new Error(`${this.defaultPrefix.getTrack} Query is not provied`)
    const node = this.getNode()
    if (this.trackCache.get(query) && cache) {
      this.client.logger.debug(`${this.defaultPrefix.getTrack} Query Keyword: ${query} Cache Available (${this.trackCache.get(query)}) returns Data`)
      return this.trackCache.get(query)
    }
    const resultFetch = await node.rest._getFetch(`/loadtracks?${new URLSearchParams({ identifier: query }).toString()}`)
      .catch(err => {
        this.client.logger.debug(`${this.defaultPrefix.getTrack} Query Keyword: ${query} ${err.name}: ${err.message}`)
      })
    if (resultFetch !== null && !['LOAD_FAILED', 'NO_MATCHES'].includes(resultFetch.loadType)) {
      this.client.logger.debug(`[AudioManager] Cache not found. registring cache... (${query})`)
      this.trackCache.set(query, resultFetch)
      resultFetch.tracks.map(el => {
        this.client.logger.debug(`[AudioManager] Registring Identifier: ${el.info.identifier}`)
        this.trackCache.set(el.info.identifier, el)
      })
      return resultFetch
    } else {
      return resultFetch
    }
  }
}

module.exports = Audio

function clone (obj) {
  if (obj === null || typeof (obj) !== 'object') { return obj }

  var copy = obj.constructor()

  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      copy[attr] = clone(obj[attr])
    }
  }

  return copy
}
