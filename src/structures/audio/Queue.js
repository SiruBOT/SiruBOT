const { EventEmitter } = require('events')
/**
 * @event startPlaying - Start Playing Track (Event)
 */
class Queue extends EventEmitter {
  constructor (audio) {
    super()
    this.audio = audio
    this.client = audio.client

    this.classPrefix = this.audio.classPrefix + ':Queue'
    this.defaultPrefix = {
      get: `${this.classPrefix}:get]`,
      enQueue: `${this.classPrefix}:enQueue]`,
      deQueue: `${this.classPrefix}:deQueue]`,
      playNext: `${this.classPrefix}:playNext]`,
      play: `${this.classPrefix}:play]`,
      autoPlay: `${this.classPrefix}:autoPlay]`,
      setNowPlaying: `${this.classPrefix}:setNowPlaying]`,
      skip: `${this.classPrefix}:skip]`,
      playRelated: `${this.classPrefix}:playRelated]`
    }
  }

  /**
   * @param {String} guildID - guildID for get Queue
   */
  get (guildID) {
    this.client.logger.debug(`${this.defaultPrefix.get} [${guildID}] Get Queue`)
    return new Promise((resolve, reject) => {
      if (!guildID) return reject(new Error('GuildID is not Provided'))
      this.client.database.getGuild(guildID)
        .then(res => {
          resolve(res.queue)
        })
        .catch(e => reject(e))
    })
  }

  /**
   * @param {String} guildID - guildID
   * @param {String} userID - userID
   * @returns
   */
  async shuffle (guildID, userID, all = false) {
    const queue = await this.get(guildID)
    const userIdMapped = queue.map(e => e.request)
    if (!userIdMapped.includes(userID)) return null
    else {
      const { result, size } = this.client.utils.array.shuffle(queue, 'request', userID, all)
      await this.client.database.updateGuild(guildID, { $set: { queue: result } })
      return size
    }
  }

  /**
   * @param {String} guildID - GuildID
   * @param {Object|Array<Object>} track - Item(s) add Queue
   * @param {Object} message = Message
   */
  async enQueue (guildID, track, requestID, related) {
    if (Array.isArray(track)) {
      const result = track.map(el => {
        el.request = requestID
        el.related = requestID === this.client.user.id
        return el
      })
      this.client.logger.debug(`${this.defaultPrefix.enQueue} [${guildID}] Added Track(s) (${track.length} Items)`)
      await this.client.database.updateGuild(guildID, { $push: { queue: { $each: result } } })
    } else {
      this.client.logger.debug(`${this.defaultPrefix.enQueue} [${guildID}] Added Track (${track.track})`)
      track.request = requestID
      track.related = requestID === this.client.user.id
      await this.client.database.updateGuild(guildID, { $push: { queue: track } })
    }
    await this.autoPlay(guildID, related)
  }

  /**
   * @description - If there is no song currently playing, and there is a song in the queue, it will play automatically.
   * @param {String} guildID - guild id to autoPlaying
   * @example - <Queue>.autoPlay('672586746587774976')
   */
  async autoPlay (guildID, error = false) {
    this.client.logger.debug(`${this.defaultPrefix.autoPlay} [${guildID}] autoPlay Started`)
    const { queue, nowplayingPosition, nowplaying } = await this.client.database.getGuild(guildID)
    if (this.audio.players.get(guildID)) {
      if (!error && nowplaying.track !== null && !this.audio.players.get(guildID).track && nowplayingPosition !== nowplaying.info.length) {
        this.client.logger.debug(`${this.defaultPrefix.autoPlay} [${guildID}] Resume Last Nowplaying...`)
        await this.play(guildID, nowplaying, nowplayingPosition, true)
        return
      }
      if (error || (queue.length > 0 && !this.audio.players.get(guildID).track)) {
        this.client.logger.debug(`${this.defaultPrefix.autoPlay} [${guildID}] Autoplaying Next Queue...`)
        await this.playNext(guildID)
      }
    }
  }

  /**
   * @param {String} guildID - guild id playing related video
   * @param {String} originVideoId - video id
   */
  async playRelated (guildID, originVideoId) {
    try {
      const relatedTracks = await this.audio.getRelated(originVideoId)
      const uniquePlayedTracks = [...new Set(this.audio.playedTracks.get(guildID))]
      const filteredTracks = relatedTracks.filter(relatedTrack => !uniquePlayedTracks.includes(relatedTrack.videoId))
      if (filteredTracks.length === 0) this.audio.playedTracks.set(guildID, [])
      const lavaLinktracks = await this.audio.getTrack(filteredTracks.shift().uri)
      const toPlay = lavaLinktracks.tracks.shift()
      if (['LOAD_FAILED', 'NO_MATCHES'].includes(lavaLinktracks.loadType) || toPlay.info.isStream) return this.playNext(guildID)
      this.client.logger.debug(`${this.defaultPrefix.playRelated} Playing related video ${toPlay.info.title} (${toPlay.info.identifier})`)
      if (!this.audio.players.get(guildID)) return this.client.logger.debug(`${this.defaultPrefix.playRelated} Abort enQueue. Player is not exists!`)
      await this.enQueue(guildID, toPlay, this.client.user.id, true) // Related 재생할때 autoPlay 부분에서 nowplaying 을 계속 재생하는 오류 하드코딩
    } catch {
      const guildData = await this.client.database.getGuild(guildID)
      this.client.audio.utils.sendMessage(guildID, this.client.utils.localePicker.get(guildData.locale, 'AUDIO_RELATED_NOT_FOUND'), true)
      this.audio.stop(guildID, true)
    }
  }

  getRepeatedObj (obj) {
    const toRepeat = obj
    toRepeat.repeated = true
    return obj
  }

  /**
   * @description - Removes the front item in the queue of the guild, depending on the repeat state
   * @param {String} guildID - guild id to skips
   * @example - <Queue>.deQueue('672586746587774976')
   */
  async deQueue (guildID, skip = false, err = false) {
    const guildData = await this.client.database.getGuild(guildID)
    if (err) { // Remove Last Element
      await this.client.database.updateGuild(guildID, { $pop: { queue: -1 } })
      return this.playNext(guildID)
    }
    if (skip) return this.client.database.updateGuild(guildID, { $pop: { queue: -1 } })
    switch (guildData.repeat) {
      case 0:
        if (!err && guildData.queue.length === 0 && this.audio.utils.getvIdfromUrl(guildData.nowplaying.info.uri) !== undefined && guildData.audioPlayrelated === true) {
          this.client.logger.debug(`${this.defaultPrefix.deQueue} [${guildID}] Playing Related Track (Repeat: ${guildData.repeat}, playingRelated: ${guildData.audioPlayrelated})`)
          return this.playRelated(guildID, this.audio.utils.getvIdfromUrl(guildData.nowplaying.info.uri))
        } else {
          this.client.logger.debug(`${this.defaultPrefix.deQueue} [${guildID}] Playing Next Track (Repeat: ${guildData.repeat})`)
          return this.playNext(guildID)
        }
      case 1:
        this.client.logger.debug(`${this.defaultPrefix.deQueue} [${guildID}] Repeat All Track (Repeat: ${guildData.repeat})`)
        if (guildData.nowplaying.info && guildData.nowplaying.info.isStream) this.client.logger.debug(`${this.defaultPrefix.deQueue} [${guildID}] Nowplaying is streaming! abort repeat request.`)
        else {
          await this.client.database.updateGuild(guildID, { $push: { queue: this.getRepeatedObj(guildData.nowplaying) } })
        }
        return this.playNext(guildID)
      case 2:
        this.client.logger.debug(`${this.defaultPrefix.deQueue} [${guildID}] Repeat Single Track (Repeat: ${guildData.repeat})`)
        if (guildData.nowplaying.info && guildData.nowplaying.info.isStream) this.client.logger.debug(`${this.defaultPrefix.deQueue} [${guildID}] Nowplaying is streaming! abort repeat request.`)
        else {
          await this.client.database.updateGuild(guildID, { $push: { queue: { $each: [this.getRepeatedObj(guildData.nowplaying)], $position: 0 } } })
        }
        return this.playNext(guildID)
    }
  }

  /**
   * @description - Skip 1 song (delete from queue and play the next song)
   * @param {String} guildID - guild id to skips
   * @example - <Queue>.skip('672586746587774976')
   */
  skip (guildID) {
    this.client.logger.debug(`${this.defaultPrefix.skip} [${guildID}] Skips Track..`)
    this.client.audio.skippers.set(guildID, [])
    return new Promise((resolve) => {
      this.audio.players.get(guildID).stopTrack().then((res) => {
        this.client.logger.debug(`${this.defaultPrefix.skip} [${guildID}] Skips Track.. Result: ${res}`)
        resolve(res)
      })
    })
  }

  /**
   * @description - If the guild's queue doesn't have the next song to play, stop playing, and if there's a song in the guild's queue, play it (queue management).
   * @param {String} guildID - guild id to playNext
   * @example - <Queue>.playNext('672586746587774976')
   */
  async playNext (guildID) {
    const guildData = await this.client.database.getGuild(guildID)
    const { queue } = guildData
    if (queue.length !== 0 || guildData.repeat === 2) {
      if (guildData.nowplaying.track !== null && guildData.repeat === 2) {
        await this.play(guildID, guildData.nowplaying)
        this.client.logger.debug(`${this.defaultPrefix.playNext} Play Next Song... (Song: ${guildData.nowplaying.track}) (Single Repeat)`)
      } else if (guildData.queue.length !== 0) {
        const playTo = queue[0]
        this.client.logger.debug(`${this.defaultPrefix.playNext} Play Next Song... (Song: ${playTo.track})`)
        await this.play(guildID, playTo)
      }
    } else {
      if (!queue[0]) {
        this.client.logger.debug(`${this.defaultPrefix.playNext} [${guildID}] Nothing items to playing next!`)
        this.emit('queueEvent', { guildID, op: 'playBackEnded' })
        this.client.audio.stop(guildID)
      }
    }
  }

  /**
   * @description - Play a track with Base64 in the player on the guildID.
   * @param {String} guildID - guild id to play
   * @param {String} trackData - base64 Track to play
   * @example - <Queue>.play('672586746587774976', 'QAAApgIAQ1vrqqnshozrpqzsmYAg6...')
   */
  async play (guildID, trackData, seekPosition = 0, nowplaying = false) {
    const { track } = trackData
    this.client.logger.debug(`${this.defaultPrefix.play} [${guildID}] Playing Item ${track}...`)
    const playOptions = {}
    Object.defineProperty(playOptions, 'noReplace', { value: false, enumerable: true })
    if (seekPosition) Object.defineProperty(playOptions, 'startTime', { value: seekPosition, enumerable: true })
    try {
      await this.audio.players.get(guildID).playTrack(track, playOptions)
      if (!this.audio.playedTracks.get(guildID)) this.audio.playedTracks.set(guildID, [])
      await this.audio.setPlayersDefaultSetting(guildID)
      await this.setNowPlaying(guildID, trackData)
      if (!nowplaying) await this.client.database.updateGuild(guildID, { $pop: { queue: -1 } })
      this.audio.playedTracks.get(guildID).push(trackData.info.identifier)
      this.emit('queueEvent', { guildID, trackData, op: 'trackStarted' })
      await this.client.audio.setPlayersDefaultSetting(guildID)
      await this.audio.utils.updateNowplayingMessage(guildID)
      return true
    } catch (e) {
      await this.setNowPlaying(guildID, { track: null })
      this.client.logger.error(`${this.defaultPrefix.play} [${guildID}] Error playing ${track}\n${e.stack}`)
      return e
    }
  }

  /**
   * @description - If there is no song currently playing, and there is a song in the queue, it will play automatically.
   * @param {String} guildID - guild id to autoPlaying
   * @param {Object} item - Object to be set as nowplaying
   * @example - <Queue>.setNowPlaying('672586746587774976', { track: null })
   */
  setNowPlaying (guildID, item) {
    this.client.logger.debug(`${this.defaultPrefix.setNowPlaying} [${guildID}] Updating Nowplaying to ${!item ? null : item.track}...`)
    return this.client.database.updateGuild(guildID, { $set: { nowplaying: item } })
  }
}

module.exports = Queue
