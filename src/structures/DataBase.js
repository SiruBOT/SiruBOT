const Mongo = require('mongoose')
const Models = require('../constant/models')
const uuid = require('node-uuid')
const knex = require('knex')
class DataBase {
  constructor (client) {
    this.client = client
    this.connection = Mongo.connection
    this.reconnectTime = 5000
    this.reconnectTries = 0
    this.maxReconnectTries = 10
    this.collections = {
      guild: 'Guild',
      user: 'User',
      member: 'Member',
      errorInfo: 'ErrorInfo',
      userPlayList: 'UserPlayList'
    }
    this.methods = {
      get: 'Get',
      update: 'Update',
      remove: 'Remove',
      add: 'Add',
      insert: 'Insert',
      increment: 'Increment'
    }
    this.classPrefix = '[DataBase'
    this.defaultPrefix = {
      init: `${this.classPrefix}:Init]`,
      getGuild: `${this.classPrefix}:${this.methods.get}:${this.collections.guild}]`,
      getUser: `${this.classPrefix}:${this.methods.get}:${this.collections.user}]`,
      getMember: `${this.classPrefix}:${this.methods.get}:${this.collections.member}]`,
      updateGuild: `${this.classPrefix}:${this.methods.update}:${this.collections.guild}]`,
      updateUser: `${this.classPrefix}:${this.methods.update}:${this.collections.user}]`,
      updateMember: `${this.classPrefix}:${this.methods.update}:${this.collections.member}]`,
      removeGuild: `${this.classPrefix}:${this.methods.remove}:${this.collections.guild}]`,
      removeUserPlayList: `${this.classPrefix}:${this.methods.remove}:${this.collections.userPlayList}]`,
      addErrorInfo: `${this.classPrefix}:${this.methods.add}:${this.collections.errorInfo}]`,
      addUserPlayList: `${this.classPrefix}:${this.methods.add}:${this.collections.userPlayList}]`
    }
    this.knexPrefix = {
      insert: `${this.classPrefix}:${this.methods.insert}]`,
      increaseTrackPlayed: `${this.classPrefix}:${this.methods.increment}:increaseTrackPlayed]`,
      getPlayedTrack: `${this.classPrefix}:${this.methods.get}:getPlayedTrack]`,
      getTrackById: `${this.classPrefix}:${this.methods.get}:getTrackById]`,
      insertPingMetrics: `${this.classPrefix}:${this.methods.insert}:insertPingMetrics]`
    }
  }

  /**
   * Initialize Database Connection
   */

  init () {
    this.connectMongo()
    this.connectMYSQL()
  }

  connectMYSQL () {
    this.knex = knex({
      client: 'mysql2',
      version: '5.7',
      connection: this.client._options.db.mysql
    })
  }

  connectMongo () {
    const { _options, logger } = this.client
    const startMs = new Date().getTime()
    logger.info(`${this.defaultPrefix.init} Connecting mongodb URL (${_options.db.mongo.mongoURL})`)
    logger.debug(`${this.defaultPrefix.init} MongoDB Options ${JSON.stringify(_options.db.mongo)}`)
    Mongo.connect(_options.db.mongo.mongoURL, _options.db.mongo.mongoOptions).then(() => {
      logger.info(`[DB:Mongo] Connected to mongodb (${new Date().getTime() - startMs}ms)`)
    }).catch(e => {
      logger.error(`[DB:Mongo] Failed To Connect mongodb (${new Date().getTime() - startMs}ms) \n${e.stack}`)
      if (this.maxReconnectTries <= this.reconnectTries) {
        throw new Error(`Failed to connect mongodb (${this.reconnectTries} Tries)`)
      }
      const calculatedReconnectTime = this.reconnectTime * (!this.reconnectTries ? 1 : this.reconnectTries)
      logger.info(`[DB:Mongo] Trying to reconnect in ${calculatedReconnectTime}ms, (${this.reconnectTries} Tries)`)
      setTimeout(() => {
        this.init()
        this.reconnectTries++
      }, calculatedReconnectTime)
    })
  }

  insertPingMetrics (ping, shardId) {
    if (!Number.isInteger(ping) || !Number.isInteger(shardId)) return this.client.logger.warn(`${this.knexPrefix.insertPingMetrics} ping or shardId not provided`)
    return this.insert('pingMetrics', { ping, shardId })
  }

  insert (table, data) {
    this.client.logger.debug(`${this.knexPrefix.insert} Insert ${table} data: ${JSON.stringify(data)}`)
    return this.knex(table).insert(data)
  }

  /**
   * @description Get Guild via guildId, Is guild is not exists, create one
   * @param {String} guildId - guild id to get
   */
  async getGuild (guildId) {
    if (!guildId) throw new Error(`${this.defaultPrefix.getGuild} Guild Id Required`)
    if (typeof guildId !== 'string') throw new Error(`${this.defaultPrefix.getGuild} Guild Id is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.getGuild} Get guild via guildId: ${guildId}`)
    let data = await this.connection.collection('guild').findOne({ _id: guildId })
    if (!data) {
      try {
        this.client.logger.debug(`${this.defaultPrefix.getGuild} Get guild via guildId: ${guildId}, but guild is not exists, create one.`)
        data = await new Models.Guild({
          _id: guildId
        }).save()
      } catch (e) {
        this.client.logger.error(`${this.defaultPrefix.getGuild} Failed to create guild data, ${e.stack}`)
        throw new Error('Failed to create guild data')
      }
    }
    return data
  }

  /**
   * @description - Get User via userId, Is userId is not exists, create one
   * @param {String} userId - user id to get
   */
  async getUser (userId) {
    if (!userId) throw new Error(`${this.defaultPrefix.getUser} User Id Required`)
    if (typeof userId !== 'string') throw new Error(`${this.defaultPrefix.getUser} User Id is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.getUser} Get user via userId: ${userId}`)
    let data = await this.connection.collection('globalUser').findOne({ _id: userId })
    if (!data) {
      try {
        this.client.logger.debug(`${this.defaultPrefix.getUser} Get user via userId: ${userId}, but user is not exists, create one.`)
        data = await new Models.User({
          _id: userId
        }).save()
      } catch (e) {
        this.client.logger.error(`${this.defaultPrefix.getUser} Failed to create user data, ${e.stack}`)
        throw new Error('Failed to create user data')
      }
    }
    return data
  }

  /**
   * @description - get Member via memberId, guildId
   * @param {String} memberId - member id to get
   * @param {String} guildId - guild id to get
   */
  async getMember (memberId, guildId) {
    if (!memberId) throw new Error(`${this.defaultPrefix.getMember} Member Id Required`)
    if (!guildId) throw new Error(`${this.defaultPrefix.getMember} Guild Id Required`)
    if (typeof memberId !== 'string') throw new Error(`${this.defaultPrefix.getMember} Member Id is must be a string`)
    if (typeof guildId !== 'string') throw new Error(`${this.defaultPrefix.getMember} Guild Id is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.getMember} Get member via memberId: ${memberId} & guildId: ${guildId}`)
    const formattedMemberId = this._getMemberId(memberId, guildId)
    let data = await this.connection.collection('guildMember').findOne({ _id: formattedMemberId })
    if (!data) {
      try {
        this.client.logger.debug(`${this.defaultPrefix.getMember} Get member via memberId: ${memberId} & guildId: ${guildId}, but member is not exists, create one.`)
        data = await new Models.Member({
          _id: formattedMemberId
        }).save()
      } catch (e) {
        this.client.logger.error(`${this.defaultPrefix.getMember} Failed to create member data, ${e.stack}`)
        throw new Error('Failed to create member data')
      }
    }
    return data
  }

  /**
   * @description Update Guild Document via query
   * @param {String} guildId - guild id to update
   * @param {Object} query - query to update
   */
  async updateGuild (guildId, query) {
    if (!guildId) throw new Error(`${this.defaultPrefix.updateGuild} Guild Id Required`)
    if (!query) throw new Error(`${this.defaultPrefix.updateGuild} Query Required`)
    if (typeof guildId !== 'string') throw new Error(`${this.defaultPrefix.updateGuild} Guild Id is must be a string`)
    if (typeof query !== 'object') throw new Error(`${this.defaultPrefix.updateGuild} Query is must be a object`)
    this.client.logger.debug(`${this.defaultPrefix.updateGuild} Update Guild: ${guildId}, Query: ${JSON.stringify(query)}`)
    return this.connection.collection('guild').updateOne({ _id: guildId }, query)
  }

  /**
   * @description Update User Document via query
   * @param {String} userId - user id to update
   * @param {Object} query - query to update
   */
  async updateUser (userId, query) {
    if (!userId) throw new Error(`${this.defaultPrefix.updateUser} User Id Required`)
    if (!query) throw new Error(`${this.defaultPrefix.updateUser} Query Required`)
    if (typeof userId !== 'string') throw new Error(`${this.defaultPrefix.updateUser} User Id is must be a string`)
    if (typeof query !== 'object') throw new Error(`${this.defaultPrefix.updateUser} Query is must be a object`)
    this.client.logger.debug(`${this.defaultPrefix.updateUser} Update User: ${userId}, Query: ${JSON.stringify(query)}`)
    return this.connection.collection('globalUser').updateOne({ _id: userId }, query)
  }

  /**
   * @description Update User Document via query
   * @param {String} userId - user id to update
   * @param {Object} query - query to update
   */
  async updateMember (memberId, guildId, query) {
    if (!memberId) throw new Error(`${this.defaultPrefix.updateMember} Member Id Required`)
    if (!guildId) throw new Error(`${this.defaultPrefix.updateMember} Guild Id Required`)
    if (!query) throw new Error(`${this.defaultPrefix.updateUser} Query Required`)
    if (typeof memberId !== 'string') throw new Error(`${this.defaultPrefix.updateMember} Member Id is must be a string`)
    if (typeof guildId !== 'string') throw new Error(`${this.defaultPrefix.updateMember} Guild Id is must be a string`)
    if (typeof query !== 'object') throw new Error(`${this.defaultPrefix.updateMember} Query is must be a object`)
    this.client.logger.debug(`${this.defaultPrefix.updateMember} Update Member: ${this._getMemberId(memberId, guildId)}, Query: ${JSON.stringify(query)}`)
    return this.connection.collection('guildMember').updateOne({ _id: this._getMemberId(memberId, guildId) }, query)
  }

  /**
   * @description Removes guild document from db
   * @param {String} guildId guild id to remove
   */
  async removeGuild (guildId) {
    if (!guildId) throw new Error(`${this.defaultPrefix.removeGuild} Guild Id Required`)
    if (typeof guildId !== 'string') throw new Error(`${this.defaultPrefix.removeGuild} Guild Id is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.removeGuild} Removed Guild: ${guildId}`)
    return this.connection.collection('guild').findOneAndDelete({ _id: guildId })
  }

  /**
   * @description Removes playlist document from db
   * @param {String} playlistId
   */
  async removeUserPlayList (playlistId) {
    if (!playlistId) throw new Error(`${this.defaultPrefix.removeUserPlayList} playlist Id Required`)
    if (typeof playlistId !== 'string') throw new Error(`${this.defaultPrefix.removeUserPlayList} playlist Id is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.removeUserPlayList} Removed Guild: ${playlistId}`)
    return this.connection.collection('userPlayList').findOneAndDelete({ _id: playlistId })
  }

  /**
   * @param {String} type - Error Type (default, audioError, commandError)
   * @param {String} name - Error message
   * @param {String} stack - Error Stack Trace
   * @param {String} author - Error Author (Command Message Author Id)
   * @param {String} guild - Error Guild (Command Message's guildId)
   * @param {String} command - Command Name (In Command Message)
   * @param {Array} args - Command Args
   * @returns {String} - UUId of ErrorInformation
   */
  addErrorInfo (type = 'default', name, stack, author, guild, command, args) {
    const createdUUId = uuid.v4()
    this.client.logger.info(`${this.defaultPrefix.addErrorInfo} Added ErrorInfo UUId: ${createdUUId}`)
    new Models.ErrorInfo({
      _id: createdUUId,
      type,
      name,
      stack,
      author,
      guild,
      command,
      args
    }).save()
    return createdUUId
  }

  async getPlayedTrack (lavalinkTrack) {
    this.client.logger.debug(`${this.knexPrefix.getPlayedTrack} Select track ${lavalinkTrack}`)
    const track = (await this.knex('playedTracks').where('lavalinkTrack', lavalinkTrack))[0]
    if (!track) {
      this.client.logger.debug(`${this.knexPrefix.getPlayedTrack} Track not found, insert ${lavalinkTrack}`)
      await this.insert('playedTracks', { lavalinkTrack })
      const track = (await this.knex('playedTracks').where('lavalinkTrack', lavalinkTrack))[0]
      return track
    } else {
      return track
    }
  }

  async getTrackById (trackId) {
    this.client.logger.debug(`${this.knexPrefix.getTrackById} Get Track via trackId: ${trackId}`)
    return this.knex('playedTracks').where('trackId', trackId)
  }

  async increaseTrackPlayed (lavalinkTrack) {
    this.client.logger.debug(`${this.knexPrefix.increaseTrackPlayed} Increse track played ${lavalinkTrack}`)
    const track = await this.getPlayedTrack(lavalinkTrack)
    await this.knex('playedTracks').where('lavalinkTrack', lavalinkTrack)
      .increment('playedCount', 1)
    return track
  }

  /**
   * @param {String} authorId - Author Id
   */
  async getPlaylistsByAuthorId (authorId) {
    if (!authorId) throw new Error('AuthorId Required')
    return Models.UserPlayList.find({ authorId: authorId })
  }

  /**
   * @param {String} name - Playlist Name
   * @param {String} author Author Id
   * @param {Array} tracks Tracks
   */
  async addUserPlayList (name, author, tracks = []) {
    if (!name) throw new Error(`${this.defaultPrefix.addUserPlayList} Name is required`)
    if (name.length > 32) throw new Error(`${this.defaultPrefix.addUserPlayList} Name can't longer than 32 char`)
    if (!author) throw new Error(`${this.defaultPrefix.addUserPlayList} Author Id is required`)
    if (!Array.isArray(tracks)) throw new Error(`${this.defaultPrefix.addUserPlayList} Tracks is must be a Array`)
    const playListId = this._makeId(5)
    if (await Models.UserPlayList.find({ _id: playListId }).length > 0) return this.addUserPlayList(name, author, tracks) // Avoid Duplicated _id property
    this.client.logger.debug(`${this.defaultPrefix.addUserPlayList} Added User Playlist, Id: ${playListId}`)
    const Model = new Models.UserPlaylist({
      _id: playListId,
      name: name,
      authorId: author,
      tracks: tracks
    })
    return Model.save()
  }

  /**
   * @description returns Member Id Formatted like `userId-guildId`
   * @param {String} userId - userId to get memberId
   * @param {String} guildId - guildId to get memberId
   */
  _getMemberId (userId, guildId) {
    return `${userId}-${guildId}`
  }

  /**
   * @description make random id
   * @param {Number} length - length to make id
   */
  _makeId (length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }
}

module.exports = DataBase
