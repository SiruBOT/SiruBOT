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
  }

  async join () {
    const BestNode = this.AudioManager.getBestNode(this.guild)
    this.node = BestNode
    this.client.logger.debug('[AudioPlayer] Joining Voice Channel...')
    this.player = await this.AudioManager.manager.join({
      guild: this.guild,
      channel: this.channel,
      host: BestNode.host
    }, { selfdeaf: true })
    this.noPlayingPlay()
  }

  /**
   * @param {(Object|Array)} item - Item(s) add Queue
   */
  async addQueue (item) {
    if (Array.isArray(item)) {
      this.client.logger.debug(`[Audio] [Queue] Added Track(s) (${item.length} Items) (Guild: ${this.guild})`)
      await this.client.database.updateGuildData(this.guild, { $push: { queue: { $each: item } } })
    } else {
      this.client.logger.debug(`[Audio] [Queue] Added Track (${item.track}) (Guild: ${this.guild})`)
      await this.client.database.updateGuildData(this.guild, { $push: { queue: item } })
    }
    this.noPlayingPlay()
  }

  /**
   * @param {Boolean} [songend] - Song End Status
   */
  async playNext (songend) {
    const first = await this.client.database.getGuildData(this.guild)
    const result = await this.client.database.updateGuildData(this.guild, { $pop: { queue: -1 } })
    if (result.result.nModified !== 0) {
      this.client.logger.debug(`[Audio] Play Next Song.... (Guild: ${this.guild}) (Song: ${first.queue[0].track})`)
      this.play(first.queue[0])
    } else {
      this.client.logger.debug(`[Audio] Empty Queue!... (Guild: ${this.guild})`)
      if (songend) return this.stop()
    }
  }

  /**
   * If nowplaying is none, play Automatically Next Queue
   */
  async noPlayingPlay () {
    const QueueData = await this.client.database.getGuildData(this.guild)
    if (!this.nowplaying) {
      if (QueueData.queue.length > 0) this.client.logger.debug(`[Audio] Resume Last Queue... (Guild: ${this.guild})`)
      this.playNext()
    }
  }

  /**
   * @param {Object} item - Playing Song Object
   */
  async play (item) {
    const volumeData = await this.client.database.getGuildData(this.guild)
    this.nowplaying = item
    this.client.database.updateGuildData(this.guild, { $set: { nowplaying: item } })
    this.player.play(item.track)
    this.player.volume(volumeData.volume)
    let chId
    if (this.textChannel.id === volumeData.tch) chId = volumeData.tch
    else if (this.textChannel.id && volumeData.tch === '0') chId = this.textChannel.id
    else if (this.textChannel.id && !this.client.channels.get(volumeData.tch)) chId = this.textChannel.id
    else if (this.textChannel.id && this.client.channels.get(volumeData.tch)) chId = volumeData.tch
    this.client.channels.get(chId).send(`> Audio System: **Playing Now In <#${this.channel}>...**\n> **${item.info.title}**`)
    this.player.once('error', () => {
      this.player.emit('end', 'error')
    })
    this.player.once('end', async (data) => {
      this.nowplaying = null
      if (data === 'error') {
        this.playNext(true)
        return this.client.logger.error(`[Audio] Error on play track: ${item.info.identifier}`)
      }
      if (data.reason === 'REPLACED') return this.client.logger.debug(`[Audio] Replaced Track! (Guild: ${this.guild})`)
      const guildData = await this.client.database.getGuildData(this.guild)
      switch (guildData.repeat) {
        case 0:
          this.client.logger.debug(`[Audio] [Repeat] Repeat Status (No_Repeat: 0) (Guild: ${this.guild})`)
          this.playNext(true)
          break
        case 1:
          this.client.logger.debug(`[Audio] [Repeat] Repeat Status (All: 1) (Guild: ${this.guild})`)
          await this.client.database.updateGuildData(this.guild, { $push: { queue: item } })
          this.playNext(true)
          break
        case 2:
          this.client.logger.debug(`[Audio] [Repeat] Repeat Status (Single: 2) (Guild: ${this.guild})`)
          await this.client.database.updateGuildData(this.guild, { $push: { queue: { $each: [item], $position: 0 } } })
          this.playNext(true)
          break
      }
    })
  }

  /**
   * @param {Boolean} [clearQueue] - Stop, If then Clear Queue
   */
  async stop (clearQueue) {
    if (clearQueue) {
      this.client.logger.debug(`[Audio] [Stop] (Clear Queue, Guild: ${this.guild})`)
      this.client.database.updateGuildData(this.guild, { $set: { queue: [] } })
    }
    await this.AudioManager.manager.leave(this.guild)
    this.AudioManager.players.delete(this.guild)
  }
}

module.exports = AudioPlayer
