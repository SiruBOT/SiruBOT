class AudioPlayer {
  /**
   * @param {Object} options - Options For AudioPlayer
   * @param {Client} options.client - Client For this Bot
   * @param {String} options.channel - VoiceChannel id for this player
   * @param {String} options.guild - Guild id for this player
   */
  constructor (options) {
    this.client = options.client
    this.AudioManager = options.AudioManager

    this.guild = options.guild
    this.loggerPrefix = `[AudioPlayer] (${this.guild})`
    this.channel = options.channel
    this.textChannel = options.textChannel

    this.node = null
    this.player = null
    this.message = null

    this.skippers = []

    this.playedSongs = []
  }

  /**
   * @description - Join Player to voiceChannel
   */
  async join () {
    const BestNode = this.AudioManager.getBestNode(this.guild)
    this.node = BestNode
    const guildData = await this.client.database.getGuildData(this.guild)
    this.client.logger.debug(`${this.loggerPrefix} [Join] (${this.channel}) Joining Voice Channel...`)
    this.player = await this.AudioManager.manager.join({
      guild: this.guild,
      channel: this.channel,
      host: BestNode.host
    }, { selfdeaf: true })
    if (!this.player.track && guildData.nowplaying.track) {
      this.client.logger.debug(`${this.loggerPrefix} [Join] [Queue] Player's track is null but db's nowplaying is exists, setting up ${this.guild}.nowplaying = { track: null }`)
      this.client.database.updateGuildData(this.guild, { $set: { nowplaying: { track: null } } })
    }
    this.autoPlay()
  }

  /**
   * @param {(Object|Array)} item - Item(s) add Queue
   * @param {Object} message = Message
   */
  async addQueue (item, message) {
    if (Array.isArray(item)) {
      const result = item.map(el => {
        el.request = message.author.id
        return el
      })
      this.client.logger.debug(`${this.loggerPrefix} [Queue] Added Track(s) (${item.length} Items)`)
      await this.client.database.updateGuildData(this.guild, { $push: { queue: { $each: result } } })
    } else {
      this.client.logger.debug(`${this.loggerPrefix} [Queue] Added Track (${item.track})`)
      item.request = message.author.id
      await this.client.database.updateGuildData(this.guild, { $push: { queue: item } })
    }
    await this.autoPlay()
  }

  /**
   * @param {Boolean} stopStatus - [Song End]
   * @param {Boolean} leave - if songs end, leaves voice channel? (Default false)
   */
  async playNext (stopStatus, leave = false) {
    this.AudioManager.updateNpMessage(this.guild)
    const picker = this.client.utils.localePicker
    const first = await this.client.database.getGuildData(this.guild)
    const result = await this.client.database.updateGuildData(this.guild, { $pop: { queue: -1 } })
    const chId = await this.getTextChannel()
    this.deleteMessage()
    if (result.result.nModified !== 0) {
      this.client.logger.debug(`${this.loggerPrefix} Play Next Song.... (Song: ${first.queue[0].track})`)
      await this.play(first.queue[0])
    } else {
      this.client.logger.debug(`${this.loggerPrefix} Empty Queue!...`)
      if (stopStatus) {
        return this.client.channels.get(chId).send(picker.get(first.locale, 'AUDIO_ALL_SONGS_FINISHED'))
      }
      if (leave) {
        return this.stop()
      }
    }
  }

  /**
   * @description - If NowPlaying is none, play Automatically Next Queue
   */
  async autoPlay () {
    const QueueData = await this.client.database.getGuildData(this.guild)
    if (!this.player.track) {
      if (QueueData.queue.length > 0) this.client.logger.debug(`${this.loggerPrefix} Resume Last Queue...`)
      await this.playNext(false)
    }
  }

  /**
  * @description - Get player's textChannel
  */
  async getTextChannel () {
    const guildData = await this.client.database.getGuildData(this.guild)
    let chId
    if (this.textChannel.id === guildData.tch) chId = guildData.tch
    else if (this.textChannel.id && guildData.tch === '0') chId = this.textChannel.id
    else if (this.textChannel.id && !this.client.channels.get(guildData.tch)) chId = this.textChannel.id
    else if (this.textChannel.id && this.client.channels.get(guildData.tch)) chId = guildData.tch
    return chId
  }

  /**
   * @param {Object} item - Playing Song Object
   */
  async play (item) {
    this.playedSongs.push(item.info.identifier)
    const picker = this.client.utils.localePicker
    const guildData = await this.client.database.getGuildData(this.guild)
    const chId = await this.getTextChannel()
    const localeMessage = item.request === this.client.user.id ? 'AUDIO_NOWPLAYING_RELATED' : 'AUDIO_NOWPLAYING'
    this.message = await this.client.channels.get(chId).send(picker.get(guildData.locale, localeMessage, { TRACK: item.info.title, DURATION: this.client.utils.timeUtil.toHHMMSS(item.info.length / 1000, item.info.isStream) }))
    await this.client.database.updateGuildData(this.guild, { $set: { nowplaying: item } })
    await this.player.play(item.track)
    await this.player.volume(guildData.volume)
    const endHandler = async (data) => {
      await this.client.database.updateGuildData(this.guild, { $set: { nowplaying: { track: null } } })
      if (data === 'error') {
        await this.playNext(true, false)
        this.deleteMessage()
        this.client.logger.error(`${this.loggerPrefix} Error on play track: ${item.info.identifier}`)
      } else {
        if (this.player) { this.player.emit('error', 'remove') }
      }
      if (data.reason === 'REPLACED') return this.client.logger.debug(`${this.loggerPrefix}  Replaced Track!`)
      const guildData = await this.client.database.getGuildData(this.guild)
      switch (guildData.repeat) {
        case 0:
          this.client.logger.debug(`${this.loggerPrefix} [Repeat] Repeat Status (No_Repeat: 0)`)
          if (guildData.queue.length === 0 && this.AudioManager.getvIdfromUrl(item.info.uri) !== undefined && guildData.audioPlayrelated === true) {
            await this.playRelated(this.AudioManager.getvIdfromUrl(item.info.uri))
          } else {
            await this.playNext(true, false)
          }
          break
        case 1:
          this.client.logger.debug(`${this.loggerPrefix} [Repeat] Repeat Status (All: 1)`)
          if (this.skip) {
            this.client.logger.debug(`${this.loggerPrefix} [Repeat] Repeat Enabled but, skipped (ignore push)`)
          } else {
            await this.client.database.updateGuildData(this.guild, { $push: { queue: item } })
          }
          await this.playNext(true, false)
          break
        case 2:
          this.client.logger.debug(`${this.loggerPrefix} [Repeat] Repeat Status (Single: 2)`)
          if (this.skip) {
            this.client.logger.debug(`${this.loggerPrefix} [Repeat] Repeat Enabled but, skipped (ignore unshift)`)
          } else {
            await this.client.database.updateGuildData(this.guild, { $push: { queue: { $each: [item], $position: 0 } } })
          }
          await this.playNext(true, false)
          break
      }
      this.skip = false
    }
    const errorHandler = (data) => {
      if (data !== 'remove') {
        this.player.removeListener('error', errorHandler)
      } else {
        this.player.emit('end', 'error')
      }
    }
    this.player.once('error', errorHandler)
    this.player.once('end', endHandler)
  }

  /**
   * @param {Boolean} [clearQueue] - Stop, If then Clear Queue
   */
  async stop (clearQueue) {
    if (clearQueue) {
      this.client.logger.debug(`${this.loggerPrefix} [Player] Stopped Audio Player & Clear Queue`)
      await this.client.database.updateGuildData(this.guild, { $set: { queue: [] } })
      await this.client.database.updateGuildData(this.guild, { $set: { nowplaying: { track: null } } })
    } else {
      this.client.logger.debug(`${this.loggerPrefix} [Player] Stopped Audio Player`)
    }
    this.playedSongs = []
    this.deleteMessage()
    this.AudioManager.updateNpMessage(this.guild, true)
    await this.player.stop()
    await this.AudioManager.manager.leave(this.guild)
    this.AudioManager.players.delete(this.guild)
  }

  /**
   * @description - playRelated
   */
  async playRelated (vId) {
    const result = await this.AudioManager.getRelated(vId)
    let number = 0
    for (const item of result.items) {
      if ((this.playedSongs.includes(vId) && item.identifier === vId) || this.playedSongs.includes(item.identifier)) {
        number += 1
      }
    }
    if (this.playedSongs.length > 100) this.playedSongs = [] // Decreses track duplication
    const track = await this.AudioManager.getSongs(`https://youtu.be/${result.items[number].identifier}`)
    this.client.logger.debug(`${this.loggerPrefix} Playing related video ${track.tracks[0].info.title} (${track.tracks[0].info.identifier})`)
    this.addQueue(track.tracks[0], this.message)
  }

  /**
   * @description - Skips current track
   */
  skipTrack () {
    this.skip = true
    this.skippers = []
    this.client.logger.debug(`${this.loggerPrefix} Skipped 1 Tracks.`)
    this.player.stop()
  }

  /**
   * @description - Delete NowPlaying Alert Message
   */
  deleteMessage () {
    if (!this.message) return
    if (this.message.deletable && this.message && this.message.deleted === false) {
      this.message.delete()
    }
  }
}

module.exports = AudioPlayer
