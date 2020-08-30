const Shoukaku = require('shoukaku')
const NodeCache = require('node-cache')
const { Collection } = require('discord.js')
const AudioTimer = require('./AudioTimer')
const Filters = require('./AudioFilters')
const Queue = require('./Queue')
const fetch = require('node-fetch')
const AudioPlayerEventRouter = require('./AudioPlayerEventRouter')
const AudioUtils = require('./AudioUtils')
const QueueEvents = require('./QueueEvents')
const { RoutePlanner, Client: relatedScraper } = require('@sirubot/yt-related-scraper')
const ONE_MIN_SEC = 60
const ONE_HOUR_SEC = ONE_MIN_SEC * 60
const HALF_HOUR_SEC = ONE_HOUR_SEC * 12
class Audio extends Shoukaku.Shoukaku {
  constructor (...args) {
    super(...args)

    this.client = args.shift()

    this.utils = new AudioUtils(this.client)

    this.classPrefix = '[Audio:Defalut'
    this.lavalinkPrefix = '[Audio:Lavalink]'
    this.defaultPrefix = {
      getTrack: `${this.classPrefix}:getTrack]`,
      join: `${this.classPrefix}:join]`,
      leave: `${this.classPrefix}:leave]`,
      stop: `${this.classPrefix}:stop]`,
      handleDisconnect: `${this.classPrefix}:handleDisconnect]`,
      setPlayerDefaultSetting: `${this.classPrefix}:setPlayerDefaultSetting]`,
      setVolume: `${this.classPrefix}:setVolume]`,
      getRelated: `${this.classPrefix}:getRelated]`,
      getUsableNodes: `${this.classPrefix}:getUsableNodes]`,
      is429: `${this.classPrefix}:is429]`,
      checkAndunmarkFailedAddresses: `${this.classPrefix}:checkAndunmarkFailedAddresses]`,
      moveNode: `${this.classPrefix}:moveNode]`
    }

    this.queue = new Queue(this)
    const queueEvents = new QueueEvents(this.client)
    this.queue.on('queueEvent', (data) => {
      queueEvents.HandleEvents(data)
    })

    this.audioTimer = new AudioTimer(this.client, this.client._options.audio.timeout)
    this.filters = new Filters(this)
    this.textChannels = new Collection()
    this.textMessages = new Collection()
    this.nowplayingMessages = new Collection()
    this.skippers = new Collection()
    this.playedTracks = new Collection()

    this.audioRouter = new AudioPlayerEventRouter(this)

    this.client.logger.info(`${this.classPrefix}] Init Audio..`)
    this.trackCache = new NodeCache({ stdTTL: ONE_HOUR_SEC })
    this.relatedCache = new NodeCache({ stdTTL: HALF_HOUR_SEC })
    if (this.client._options.audio.relatedRoutePlanner.ipBlocks.length > 0) {
      const { relatedRoutePlanner } = this.client._options.audio
      this.relatedRoutePlanner = new RoutePlanner(relatedRoutePlanner.ipBlocks, relatedRoutePlanner.excludeIps, relatedRoutePlanner.retryCount)
      this.client.logger.info(`[RoutePlanner] RoutePlanner Enabled, ${relatedRoutePlanner.ipBlocks.length} ipBlocks, ${relatedRoutePlanner.excludeIps.length} excludeIps, ${relatedRoutePlanner.retryCount} retryCount`)
      this.client.logger.debug(`[RoutePlanner] RoutePlanner Enabled, ipBlocks: [${relatedRoutePlanner.ipBlocks.join(', ')}] excludeIps: [${relatedRoutePlanner.excludeIps.length === 0 ? 'None' : relatedRoutePlanner.excludeIps.join(', ')}] retryCount: ${relatedRoutePlanner.retryCount}`)
    }
    this.node429Cache = new NodeCache({ stdTTL: ONE_HOUR_SEC })

    this.on('ready', (name, resumed) => this.client.logger.info(`${this.lavalinkPrefix} Lavalink Node: ${name} is now connected. This connection is ${resumed ? 'resumed' : 'a new connection'}`))
    this.on('error', (name, error) => this.client.logger.error(`${this.lavalinkPrefix} Lavalink Node: ${name} emitted an error. ${error.stack}`))
    this.on('close', (name, code, reason) => this.client.logger.warn(`${this.lavalinkPrefix} Lavalink Node: ${name} closed with code ${code}. Reason: ${reason || 'No reason'}`))
    this.on('disconnected', (name, reason) => this.client.logger.warn(`${this.lavalinkPrefix} Lavalink Node: ${name} disconnected. Reason: ${reason || 'No reason'}`))
    this.on('debug', (name, data) => this.client.logger.debug(`${this.lavalinkPrefix} Lavalink Node: ${name} - Data: ${JSON.stringify(data)}`))
  }

  /**
   * @param {String} voiceChannelID - voiceChannelId join for
   * @param {String} guildID - guildID of voiceChannel
   */
  join (voiceChannelID, guildID) {
    return new Promise((resolve, reject) => {
      this.getNode().then(node => {
        node.joinVoiceChannel({
          guildID: guildID,
          voiceChannelID: voiceChannelID
        }).then((player) => {
          this.audioRouter.registerEvents(player)
          this.setPlayersDefaultSetting(guildID)
          this.client.logger.debug(`${this.defaultPrefix.join} [${guildID}] [${voiceChannelID}] Successfully joined voiceChannel.`)
          this.queue.autoPlay(guildID)
          resolve(true)
        }).catch(e => {
          this.client.logger.error(`${this.defaultPrefix.join} [${guildID}] [${voiceChannelID}] Failed to join voiceChannel [${e.name}: ${e.message}]`)
          reject(e)
        })
      }).catch((e) => {
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
    this.audioTimer.clearTimer(guildID)
    if (cleanQueue) {
      this.client.database.updateGuild(guildID, { $set: { queue: [] } })
      this.queue.setNowPlaying(guildID, { track: null })
      this.client.database.updateGuild(guildID, { $set: { nowplayingPosition: 0 } })
      this.playedTracks.set(guildID, [])
      this.textChannels.delete(guildID)
      this.textMessages.delete(guildID)
    }
    this.utils.updateNowplayingMessage(guildID)
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
      return this.players.get(guildID).setVolume(vol)
    }
  }

  /**
   * @description - Get Nodes sort by players.
   */
  async getNode (name = undefined) {
    if (!name || this.nodes.get(name)) return (await this.getUsableNodes()).sort((a, b) => { return a.stats.players - b.stats.players }).sort((a, b) => { return a.players.size - b.players.size }).shift()
    else {
      this.nodes.get(name)
    }
  }

  async getUsableNodes () {
    const connectedNodes = Array.from(this.nodes.values()).filter(el => el.state === 'CONNECTED')
    const result = []
    for (const node of connectedNodes) {
      try {
        if (!await this.is429(node)) result.push(node)
      } catch (e) {
        this.client.logger.error(`${this.defaultPrefix.getUsableNodes} Failed to check is node blocked from youtube ${e.stack}`)
      }
    }
    return result
  }

  async is429 (node) {
    this.client.logger.debug(`${this.defaultPrefix.is429} Check Is Node 429 [${node.name}]`)
    if (this.node429Cache.get(node.name) !== undefined) {
      this.client.logger.debug(`${this.defaultPrefix.is429} [${node.name}] Cache Hit, ${this.node429Cache.get(node.name)}`)
      return this.node429Cache.get(node.name)
    } else this.client.logger.debug(`${this.defaultPrefix.is429} [${node.name}] Cache not found, Requesting to Node..`)
    const json = await node.rest.getRoutePlannerStatus()
    json.nodeName = node.name
    let node429Status
    if (!json.class && !json.details) node429Status = false
    else {
      const { ipBlock, failingAddresses } = json.details
      const unmarkStatus = await this.checkAndunmarkFailedAddresses(node, failingAddresses)
      if (unmarkStatus) return this.is429(node)
      else if (ipBlock.size <= failingAddresses.length) node429Status = true
      else node429Status = false
    }
    this.client.logger.debug(`${this.defaultPrefix.is429} [${node.name}] 429 Status: ${node429Status}, Routeplanner: ${json.class}, ${json.details ? `${json.details.ipBlock.type} (${json.details.ipBlock.size} Addresses)` : json.details}`)
    this.node429Cache.set(json.nodeName, node429Status)
    return node429Status
  }

  /**
   * @param {ShoukakuSocket} node ShoukakuSocket Instance
   * @param {Object} failingAddresses - Address Info Object
   * @returns {Promise<Boolean>} 429 Status
   */
  checkAndunmarkFailedAddresses (node, failingAddresses) {
    return new Promise((resolve, reject) => {
      this.client.logger.debug(`${this.defaultPrefix.checkAndunmarkFailedAddresses} [${node.name}] Checking FailedAddresses Expired Date..`)
      const TWO_DAY_MILLISEC = (HALF_HOUR_SEC * 2) * 2 * 1000
      const unmarkableAddresses = failingAddresses.filter(el => el.failingTimestamp + TWO_DAY_MILLISEC <= new Date().getTime())
      if (unmarkableAddresses.length === 0) {
        this.client.logger.debug(`${this.defaultPrefix.checkAndunmarkFailedAddresses} Failed Addresses Not Found.`)
        return resolve(false)
      }
      this.client.logger.debug(`${this.defaultPrefix.checkAndunmarkFailedAddresses} [${node.name}] ${unmarkableAddresses.length} Unmarkable addresses`)
      Promise.all(unmarkableAddresses.map(el => {
        this.client.logger.debug(`${this.defaultPrefix.checkAndunmarkFailedAddresses} [${node.name}] Unmark Address ${el.failingAddress} Failed at: ${el.failingTimestamp} (${el.failingTime})`)
        return new Promise((resolve, reject) => {
          fetch(new URL('/routeplanner/free/address', node.rest.url), {
            method: 'POST',
            headers: { Authorization: node.rest.auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: el.failingAddress.replace('/', '')
            })
          })
            .then((res) => {
              this.client.logger.debug(`${this.defaultPrefix.checkAndunmarkFailedAddresses} [${node.name}] Unmark ${el.failingAddress} (Response Code: ${res.status})`)
              if (!res.ok) {
                reject(new Error(`Unexpected Server response ${res.status}`))
              } else resolve(res.status)
            }).catch((e) => {
              this.client.logger.debug(`${this.defaultPrefix.checkAndunmarkFailedAddresses} [${node.name}] Failed To Unmark ${el.failingAddress}`)
              reject(e)
            })
        })
      })).then((arr) => {
        this.client.logger.debug(`${this.defaultPrefix.checkAndunmarkFailedAddresses} [${node.name}] [${node.name}] Successfully unmark ${arr.length} Addresses`)
        return resolve(true)
      }).catch(reject)
    })
  }

  /**
   * @param {String} vId - Youtube Video Id
   */
  async getRelated (vId) {
    if (this.relatedCache.get(vId) && this.relatedCache.get(vId).length > 0) {
      this.client.logger.debug(`${this.defaultPrefix.getRelated} Cache Hit [${vId}], returns ${this.relatedCache.get(vId).length} Items`)
      return this.relatedCache.get(vId)
    }
    this.client.logger.warn(`${this.defaultPrefix.getRelated} No Cache Hits for [${vId}], Scrape related videos`)
    try {
      let scrapeResult
      if (this.relatedRoutePlanner) scrapeResult = await relatedScraper.get(vId, this.relatedRoutePlanner)
      else scrapeResult = await relatedScraper.get(vId)
      if (scrapeResult.length <= 0) throw new Error('Scrape result not found.')
      this.relatedCache.set(vId, scrapeResult)
      this.client.logger.debug(`${this.defaultPrefix.getRelated} Registering Cache [${vId}], ${scrapeResult.length} Items`)
      return scrapeResult
    } catch (e) {
      this.client.logger.error(`${this.defaultPrefix.getRelated} Failed to scrape youtube related video ${e.stack}`)
      throw e
    }
  }

  /**
   * @param {String} query - Search String ('ytsearch: asdfmovie')
   * @returns {Promise<Object>} - query Result (Promise)
   */
  async getTrack (query, cache = true) {
    if (!query) return new Error(`${this.defaultPrefix.getTrack} Query is not provied`)
    const node = await this.getNode()
    if (this.trackCache.get(query) && cache) {
      this.client.logger.debug(`${this.defaultPrefix.getTrack} Query Keyword: ${query} Cache Available (${this.trackCache.get(query)}) returns Data`)
      return this.trackCache.get(query)
    }
    const resultFetch = await this.getFetch(node, query)
    if (resultFetch !== null && !['LOAD_FAILED', 'NO_MATCHES'].includes(resultFetch.loadType)) {
      this.client.logger.debug(`[AudioManager] Cache not found. registring cache... (${query})`)
      this.trackCache.set(query, resultFetch)
      resultFetch.tracks.map(el => {
        if (query === el.info.identifier) return
        this.client.logger.debug(`[AudioManager] Registring Identifier: ${el.info.identifier}`)
        this.trackCache.set(el.info.identifier, el)
      })
    }
    return resultFetch
  }

  getFetch (node, query) {
    this.client.logger.debug(`${this.defaultPrefix.getTrack} Resolve Track ${query} Node #${node.name} Request URL: /loadtracks?${new URLSearchParams({ identifier: query }).toString()}`)
    return new Promise((resolve) => {
      node.rest._getFetch(`/loadtracks?${new URLSearchParams({ identifier: query }).toString()}`)
        .then(data => {
          this.client.logger.debug(`${this.defaultPrefix.getTrack} Resolve Track ${query} Node #${node.name} Result ${JSON.stringify(data)}`)
          resolve(data)
        })
        .catch(err => {
          this.client.logger.error(`${this.defaultPrefix.getTrack} Query Keyword: ${query} ${err.name}: ${err.message}`)
          resolve(Object.assign({ loadType: 'LOAD_FAILED', exception: { message: err.message } }))
        })
    })
  }
}

module.exports = Audio
