const Discord = require('discord.js')
class AudioUtils {
  constructor (client) {
    this.client = client
    this.classPrefix = this.client.classPrefix + ':AudioUtils'
    this.defaultPrefix = {
      sendMessage: `${this.classPrefix}:sendMessage]`,
      getPlayingState: `${this.classPrefix}:getPlayingState]`,
      updateNowplayingMessage: `${this.classPrefix}:updateNowplayingMessage]`
    }
  }

  /**
   * @param {String} guildID
   */
  addSkipper (guildID, skipper) {
    if (!guildID) return new Error('no GuildID Provied')
    if (!this.client.audio.skippers.get(guildID)) this.client.audio.skippers.set(guildID, [])
    if (!this.client.audio.skippers.get(guildID).includes(skipper)) this.client.audio.skippers.get(guildID).push(skipper)
    return this.client.audio.skippers.get(guildID)
  }

  formatTrack (trackInfo) {
    return `**${Discord.Util.escapeMarkdown(trackInfo.title)} [${this.client.utils.timeUtil.toHHMMSS(trackInfo.length / 1000, trackInfo.isStream)}]**`
  }

  /**
   * @param {String} - guildID Id to get playing state (pause,playing,no)
   * @returns {String} - 'pause', 'playing', 'none'
   */
  getPlayingState (guildID) {
    let state
    if (!this.client.audio.players.get(guildID)) state = 'NONE'
    if (this.client.audio.players.get(guildID).paused) state = 'PAUSED'
    else state = 'PLAYING'
    this.client.logger.debug(`${this.defaultPrefix.getPlayingState} (get) Playing State ${state}`)
    return state
  }

  /**
   * @description Update Nowplaying Message
   * @param {String} guildId - guildId of to update nowplaying message
   * @param {Boolean} stop - If True, delete guildId of nowplayingMessage from nowplayingMessagesCollection
   */
  updateNowplayingMessage (guildID, stop = false) {
    this.client.logger.debug(`${this.defaultPrefix.updateNowplayingMessage} Updating nowplaying message (${guildID}, ${stop})`)
    const npMessage = this.client.audio.nowplayingMessages.get(guildID)
    if (npMessage && npMessage.deleted === false && npMessage.editable) {
      this.getNowplayingEmbed(guildID).then(embed => {
        npMessage.edit(embed)
      })
    } else this.client.audio.nowplayingMessages.delete(guildID)
    if (stop) this.client.audio.nowplayingMessages.delete(guildID)
  }

  /**
   * @param {String} guild - Guild Id to get nowplaying Embed
   */
  async getNowplayingEmbed (guildID) {
    const guildData = await this.client.database.getGuild(guildID)
    const messageEmbed = new Discord.MessageEmbed()
    if (!this.client.audio.players.get(guildID) || !guildData.nowplaying.track) {
      messageEmbed
        .setTitle(this.client.utils.localePicker.get(guildData.locale, 'NOWPLAYING_NOTRACK'))
        .setColor(this.client.utils.findUtil.getColor(this.client.guilds.cache.get(guildID).me))
    } else {
      const request = this.client.users.cache.get(guildData.nowplaying.request)
      messageEmbed
        .setAuthor(request.tag, request.displayAvatarURL({ format: 'png', size: 512 }))
        .setTitle(Discord.Util.escapeMarkdown(guildData.nowplaying.info.title))
        .setURL(guildData.nowplaying.info.uri)
        .setDescription(this.getNowplayingText(guildID, guildData))
        .setColor(this.client.utils.findUtil.getColor(this.client.guilds.cache.get(guildID).me))
        .setThumbnail(this.validateYouTubeUrl(guildData.nowplaying.info.uri) ? `https://img.youtube.com/vi/${guildData.nowplaying.info.identifier}/mqdefault.jpg` : 'https://1001freedownloads.s3.amazonaws.com/icon/thumb/340/music-512.png')
    }
    return messageEmbed
  }

  /**
   * @param {String} url - Url to check validate
   * @return {Boolean} - If url is youtube url, returns true, else returns false
   */
  validateYouTubeUrl (url) {
    const regExp = new RegExp(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/)
    const match = url.match(regExp)
    if (match && match[2].length === 11) return true
    else return false
  }

  /**
   * @description Get Formatted(Nowplaying) Text with informations
   * @param {String} guildID - guildIDId to formatting
   * @param {Object} guildData - Database Object
   */
  getNowplayingText (guildID, guildData) {
    if (!this.client.audio.players.get(guildID) || !guildData.nowplaying.track) return this.client.utils.localePicker.get(guildData.locale, 'NOWPLAYING_NOTRACK')
    const nowPlayingObject = this.getNowplayingObject(guildID, guildData)
    return `${nowPlayingObject.playingStatus} ${nowPlayingObject.progressBar} \`\`${nowPlayingObject.time}\`\` ${nowPlayingObject.volume}`
  }

  /**
   * @param {String} guildID - guildIDId to formatting
   * @param {Object} guildData - Database Object
   */
  getNowplayingObject (guildID, guildData) {
    const obj = Object.assign({})
    Object.defineProperty(obj, 'playingStatus', { value: this.client._options.constructors['EMOJI_AUDIO_' + this.getPlayingState(guildID)] })
    Object.defineProperty(obj, 'repeatStatus', { value: this.client._options.constructors['EMOJI_' + this.getRepeatState(guildData.repeat)] })
    if (this.client.audio.players.get(guildID) && this.client.audio.players.get(guildID).track) Object.defineProperty(obj, 'progressBar', { value: this.getProgressBar(this.client.audio.players.get(guildID).position / guildData.nowplaying.info.length) })
    else Object.defineProperty(obj, 'progressBar', { value: this.getProgressBar(0) })
    if (this.client.audio.players.get(guildID) && this.client.audio.players.get(guildID).track) Object.defineProperty(obj, 'time', { value: `[${this.client.utils.timeUtil.toHHMMSS(this.client.audio.players.get(guildID).position / 1000, false)}/${this.client.utils.timeUtil.toHHMMSS(guildData.nowplaying.info.length / 1000, guildData.nowplaying.info.isStream)}]` })
    else Object.defineProperty(obj, 'time', { value: `[${this.client.utils.timeUtil.toHHMMSS(0, false)}/${this.client.utils.timeUtil.toHHMMSS(0, false)}]` })
    Object.defineProperty(obj, 'volume', { value: `${this.getVolumeEmoji(guildData.volume)} **${guildData.volume}%**` })
    return obj
  }

  /**
   * @description - If previous message is deletable, delete message. then send new Text message
   * @param {*} guildID - guildId for sending message
   * @param {*} text - text content to send
   * @example - <AudioUtils>.sendMessage('672586746587774976', 'Hello World!')
   */
  async sendMessage (guildID, text) {
    const guildData = await this.client.database.getGuild(guildID)
    const { audioMessage, tch } = guildData
    if (audioMessage) {
      const sendChannel = this.getChannel(this.client.audio.textChannels.get(guildID), tch)
      if (!sendChannel) return this.client.logger.error(`${this.defaultPrefix.sendMessage} Channel Not Found... Please check database or audio TextChannels!`)
      if (sendChannel.permissionsFor(this.client.guilds.cache.get(guildID).me).has('SEND_MESSAGES')) {
        this.client.logger.debug(`${this.defaultPrefix.sendMessage} Send Message "${text}" to channel ${sendChannel.id}`)
        if (this.client.audio.textMessages.get(guildID) && this.client.audio.textMessages.get(guildID).deletable) {
          this.client.logger.debug(`${this.defaultPrefix.sendMessage} [${guildID}] Deletable previous message, delete previous message...`)
          this.client.audio.textMessages.get(guildID).delete()
        }
        sendChannel.send(text).then(m => this.client.audio.textMessages.set(guildID, m))
      }
    }
  }

  /**
   * @description - Compares channelID1, channelID2
   * @param {*} channelID1 - last command channel Id
   * @param {*} channelID2 - Database's channel Id
   */
  getChannel (channelID1, channelID2) {
    if (channelID1 === channelID2) return this.client.channels.cache.get(channelID2)
    if (this.client.channels.cache.get(channelID2)) return this.client.channels.cache.get(channelID2)
    else return this.client.channels.cache.get(channelID1)
  }

  /**
   * @param {Number} volume - Volume of get emoji
   * @returns {String} - Emojis (🔇, 🔉, 🔊)
   * @description 아래의 코드는 jagrosh/MusicBot 의
   * @description https://github.com/jagrosh/MusicBot/blob/master/src/main/java/com/jagrosh/jmusicbot/utils/FormatUtil.java
   * @description 라인 53 ~ 61 을 사용 (수정) 하였음을 명시합니다.
   */
  getVolumeEmoji (volume) {
    if (volume === 0) { return '🔇' }
    if (volume < 30) { return '🔉' }
    if (volume < 70) { return '🔊' }
    return '🔊'
  }

  /**
   * @description Checking is member listenable
   * @param {Discord.Member} member - Member to checking
   */
  getVoiceStatus (member) {
    return Object.assign({
      listen: this.getListenStatus(member),
      speak: this.getVoiceMuteStatus(member)
    })
  }

  /**
   * @description Get VoiceMute Status
   * @param {Discord.Member} member - Member to check
   * @returns {Boolean} - false, true
   */
  getVoiceMuteStatus (member) {
    if (member.selfMute) return false
    if (member.serverMute) return false
    else return true
  }

  /**
   * @param {String} userID
   * @param {String} guildID
   */
  async getMembersQueue (userID, guildID) {
    const queueData = await this.client.audio.queue.get(guildID)
    return queueData.filter((Track) => Track.request === userID)
  }

  /**
   * @description Get Listen Status
   * @param {Discord.Member} member - Member to check
   * @returns {Boolean} - false, true
   */
  getListenStatus (member) {
    if (member.serverDeaf) return false
    if (member.selfDeaf) return false
    else return true
  }

  /**
   * @param {Number} number - 0, 1, 2 (Repeat Stats)
   * @returns {String} - 'REPEAT_NONE', 'REPEAT_ALL', 'REPEAT_SINGLE'
   */
  getRepeatState (number) {
    switch (number) {
      case 0:
        return 'REPEAT_NONE'
      case 1:
        return 'REPEAT_ALL'
      case 2:
        return 'REPEAT_SINGLE'
    }
  }

  /**
   * @param {Number} percent - Player's Position / Track Duration (miliseconds)
   * @returns {String} - 🔘▬▬▬▬▬▬▬▬▬▬▬
   * @description 아래의 코드는 jagrosh/MusicBot 의
   * @description https://github.com/jagrosh/MusicBot/blob/master/src/main/java/com/jagrosh/jmusicbot/utils/FormatUtil.java
   * @description 라인 40 ~ 50 을 사용 (수정) 하였음을 명시합니다.
   */
  getProgressBar (percent) {
    let str = ''
    for (let i = 0; i < 12; i++) {
      if (i === parseInt(percent * 12)) {
        str += '🔘'
      } else {
        str += '▬'
      }
    }
    return str
  }
}

module.exports = AudioUtils
