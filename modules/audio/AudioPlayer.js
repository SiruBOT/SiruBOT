class AudioPlayer {
  /**
   * @param {Object} options - Options For AudioPlayer
   * @param {Client} options.client - Client For this Bot
   * @param {String} options.channel - VoiceChannel id for this player
   * @param {String} options.guild - Guild id for this player
   */
  constructor (options) {
    this.AudioManager = options.AudioManager
    this.client = options.client
    this.guild = options.guild
    this.channel = options.channel
    this.textChannel = options.textChannel
    this.player = null
    this.node = null
    this.nowplaying = null
    this.message = null
  }

  /**
   * @description - Join Player to voiceChannel
   */
  async join () {
    const BestNode = this.AudioManager.getBestNode(this.guild)
    this.node = BestNode
    this.client.logger.debug(`[AudioPlayer] Joining Voice Channel... (Player: (Guild: ${this.guild}) (Channel: ${this.channel}))`)
    this.player = await this.AudioManager.manager.join({
      guild: this.guild,
      channel: this.channel,
      host: BestNode.host
    }, { selfdeaf: true })
    this.autoPlay()
  }

  /**
   * @param {(Object|Array)} item - Item(s) add Queue
   */
  async addQueue (item, message) {
    if (Array.isArray(item)) {
      const result = item.map(el => {
        el.request = message.author.id
        return el
      })
      this.client.logger.debug(`[Audio] [Queue] Added Track(s) (${item.length} Items) (Guild: ${this.guild})`)
      await this.client.database.updateGuildData(this.guild, { $push: { queue: { $each: result } } })
    } else {
      this.client.logger.debug(`[Audio] [Queue] Added Track (${item.track}) (Guild: ${this.guild})`)
      item.request = message.author.id
      await this.client.database.updateGuildData(this.guild, { $push: { queue: item } })
    }
    await this.autoPlay()
  }

  /**
   * @param {Boolean} [songend] - Song End Status
   */
  async playNext (stopStatus, leave = false) {
    this.AudioManager.updateNpMessage(this.guild)
    const picker = this.client.utils.localePicker
    const first = await this.client.database.getGuildData(this.guild)
    const result = await this.client.database.updateGuildData(this.guild, { $pop: { queue: -1 } })
    const chId = await this.getTextChannel()
    this.deleteMessage()
    if (result.result.nModified !== 0) {
      this.client.logger.debug(`[Audio] Play Next Song.... (Guild: ${this.guild}) (Song: ${first.queue[0].track})`)
      await this.play(first.queue[0])
    } else {
      this.client.logger.debug(`[Audio] Empty Queue!... (Guild: ${this.guild})`)
      if (stopStatus) {
        return this.client.channels.get(chId).send(picker.get(first.locale, 'AUDIO_ALL_SONGS_FINISHED'))
      }
      if (leave) {
        return this.stop()
      }
    }
  }

  /**
   * If nowplaying is none, play Automatically Next Queue
   */
  async autoPlay () {
    const QueueData = await this.client.database.getGuildData(this.guild)
    if (!this.nowplaying) {
      if (QueueData.queue.length > 0) this.client.logger.debug(`[Audio] Resume Last Queue... (Guild: ${this.guild})`)
      await this.playNext(false)
    }
  }

  /**
  * @param {*} item
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
    const picker = this.client.utils.localePicker
    const guildData = await this.client.database.getGuildData(this.guild)
    const chId = await this.getTextChannel()
    this.message = await this.client.channels.get(chId).send(picker.get(guildData.locale, 'AUDIO_NOWPLAYING', { TRACK: item.info.title, DURATION: this.client.utils.timeUtil.toHHMMSS(item.info.length / 1000, item.info.isStream) }))
    this.nowplaying = item
    await this.client.database.updateGuildData(this.guild, { $set: { nowplaying: item } })
    await this.player.play(item.track)
    await this.player.volume(guildData.volume)
    this.player.once('error', (data) => {
      if (data !== 'remove') {
        return this.player.emit('end', 'error')
      }
    })
    this.player.once('end', async (data) => {
      this.nowplaying = null
      if (data === 'error') {
        await this.playNext(true, false)
        this.deleteMessage()
        return this.client.logger.error(`[Audio] Error on play track: ${item.info.identifier}`)
      } else {
        this.player.emit('error', 'remove')
      }
      if (data.reason === 'REPLACED') return this.client.logger.debug(`[Audio] Replaced Track! (Guild: ${this.guild})`)
      const guildData = await this.client.database.getGuildData(this.guild)
      switch (guildData.repeat) {
        case 0:
          this.client.logger.debug(`[Audio] [Repeat] Repeat Status (No_Repeat: 0) (Guild: ${this.guild})`)
          await this.playNext(true, false)
          break
        case 1:
          this.client.logger.debug(`[Audio] [Repeat] Repeat Status (All: 1) (Guild: ${this.guild})`)
          await this.client.database.updateGuildData(this.guild, { $push: { queue: item } })
          await this.playNext(true, false)
          break
        case 2:
          this.client.logger.debug(`[Audio] [Repeat] Repeat Status (Single: 2) (Guild: ${this.guild})`)
          await this.client.database.updateGuildData(this.guild, { $push: { queue: { $each: [item], $position: 0 } } })
          await this.playNext(true, false)
          break
      }
    })
  }

  /**
   * @param {Boolean} [clearQueue] - Stop, If then Clear Queue
   */
  async stop (clearQueue) {
    if (clearQueue) {
      this.client.logger.debug(`[Audio] [Player] Stopped Audio Player & Clear Queue (Guild: ${this.guild})`)
      this.client.database.updateGuildData(this.guild, { $set: { queue: [] } })
    } else {
      this.client.logger.debug(`[Audio] [Player] Stopped Audio Player (Guild: ${this.guild})`)
    }
    this.deleteMessage()
    this.AudioManager.updateNpMessage(this.guild, true)
    await this.player.stop()
    await this.AudioManager.manager.leave(this.guild)
    this.AudioManager.players.delete(this.guild)
  }

  /**
   * @description - Delete Now Playing Alert Message
   */
  deleteMessage () {
    if (!this.message) return
    if (this.message.deletable && this.message && this.message.deleted === false) {
      this.message.delete()
    }
  }
}

module.exports = AudioPlayer
