class AudioFilters {
  constructor (audio) {
    this.client = audio.client
    this.bassGains = [
      [0, -0.05], // 25 Hz
      [1, 0.07], // 40 Hz
      [2, 0.16], // 63 Hz
      [3, 0.03], // 100 Hz
      [4, -0.05], // 160 Hz
      [5, -0.11] // 250 Hz
    ]
  }

  /**
   * @param {String} guildID - guildId set to
   * @param {String} filter - filter name
   * @param {*} value - value
   */
  setPlayerFilter (guildID, filter, value) {
    if (!guildID) throw new Error('guildId not provided')
    if (!filter) throw new Error('filter not provided')
    if (!value) throw new Error('value not provided')
    if (!this.client.audio.players.get(guildID)) throw new Error('player not found')
    this.client.audio.players.get(guildID)[filter] = value
    return this.client.audio.players.get(guildID)[filter]
  }

  getFilterValue (guildID, value) {
    if (!value) return null
    if (!this.client.audio.players.get(guildID)) return null
    if (this.client.audio.players.get(guildID)[value]) return this.client.audio.players.get(guildID)[value]
    return null
  }

  /**
   * @param {String} guildID - guildId for set
   * @param {Number} percentage - percentage of multiplier
   */
  bassboost (guildID, percentage) {
    if (!guildID) throw new Error('guildId not provided')
    if (!this.client.audio.players.get(guildID)) throw new Error('player not found')
    const multiplier = percentage / 50
    const bands = []
    for (const [band, gain] of this.bassGains) {
      if (multiplier === 0) bands.push(this.getBand(band, 0))
      else bands.push(this.getBand(band, gain * multiplier))
    }
    this.client.audio.players.get(guildID).setEqualizer(bands)
    this.setPlayerFilter(guildID, 'bboost', { bands, percentage })
    return { bands, percentage }
  }

  /**
   * @param {Number} band - Equalizer Band
   * @param {Number} gain - Band Gain
   */
  getBand (band = 0, gain = 0.25) {
    const bandObj = {}
    Object.defineProperty(bandObj, 'band', { value: band, enumerable: true })
    Object.defineProperty(bandObj, 'gain', { value: gain, enumerable: true })
    return bandObj
  }

  /**
   * @param {String} guildID - guildId for set
   * @param {Number} level - Karaoke Value
   * @param {Number} monoLevel - Karaoke monoLevel
   * @param {Number} filterBand - Karaoke filterBand
   * @param {Number} filterWidth - Karaoke filterWidth
   */
  setKaraoke (guildID, level = 1, monoLevel = 1, filterBand = 220, filterWidth = 100) {
    if (!guildID) throw new Error('guildId not provided')
    if (!this.client.audio.players.get(guildID)) throw new Error('player not found')
    const payload = {}
    Object.defineProperty(payload, 'op', { value: 'karaoke', enumerable: true })
    Object.defineProperty(payload, 'guildId', { value: guildID, enumerable: true })
    const karaokeObject = {}
    Object.defineProperty(karaokeObject, 'level', { value: level, enumerable: true })
    Object.defineProperty(karaokeObject, 'monoLevel', { value: monoLevel, enumerable: true })
    Object.defineProperty(karaokeObject, 'filterBand', { value: filterBand, enumerable: true })
    Object.defineProperty(karaokeObject, 'filterWidth', { value: filterWidth, enumerable: true })
    Object.assign(payload, karaokeObject)
    this.setPlayerFilter(guildID, 'karaoke', karaokeObject)
    this.client.audio.players.get(guildID).voiceConnection.node.send(payload)
    return karaokeObject
  }

  /**
   * @param {String} guildID - guildId for set
   * @param {Number} speed - TimeScale speed (value > 0)
   * @param {Number} pitch - TimeScale pitch (value > 0)
   * @param {Number} rate - TimeScale rate (value > 0)
   */
  setTimescale (guildID, speed = 1, pitch = 1, rate = 1) {
    if (!guildID) throw new Error('guildId not provided')
    if (!this.client.audio.players.get(guildID)) throw new Error('player not found')
    const payload = {}
    Object.defineProperty(payload, 'op', { value: 'timescale', enumerable: true })
    Object.defineProperty(payload, 'guildId', { value: guildID, enumerable: true })
    const timeObject = {}
    if (speed > 0) Object.defineProperty(timeObject, 'speed', { value: speed, enumerable: true })
    else throw new Error('speed must be `value > 0`')
    if (pitch > 0) Object.defineProperty(timeObject, 'pitch', { value: pitch, enumerable: true })
    else throw new Error('pitch must be `value > 0`')
    if (rate > 0) Object.defineProperty(timeObject, 'rate', { value: rate, enumerable: true })
    else throw new Error('rate must be `value > 0`')
    Object.assign(payload, timeObject)
    this.setPlayerFilter(guildID, 'timescale', timeObject)
    this.client.audio.players.get(guildID).voiceConnection.node.send(payload)
    return timeObject
  }
}

module.exports = AudioFilters
