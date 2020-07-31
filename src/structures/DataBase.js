const Mongo = require('mongoose')
const Models = require('../constant/models')
const uuid = require('node-uuid')
const knex = require('knex')
const knexDefaultOption = {
  client: 'mysql2',
  version: '5.7',
  connection: {}
}
class DataBase {
  constructor (client) {
    this.client = client
    this.connection = Mongo.connection
    // Constants
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
      add: 'Add'
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
  }

  /**
   * Initialize Database Connection
   */

  init () {

  }

  connectKnex () {

  }

  connectMongo () {
    const { _options, logger } = this.client
    const startMs = new Date().getTime()
    logger.info(`${this.defaultPrefix.init} Connecting URL (${_options.db.mongo.mongoURL})`)
    Mongo.connect(_options.db.mongo.mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      user: _options.db.mongo.user,
      pass: _options.db.mongo.password
    }).then(() => {
      logger.info(`[DB] Connected to database (${new Date().getTime() - startMs}ms)`)
    }).catch(e => {
      logger.error(`[DB] Failed To Initialize Database. (${new Date().getTime() - startMs}ms) \n${e.stack}`)
      if (this.maxReconnectTries <= this.reconnectTries) {
        throw new Error(`Failed to connect database (${this.reconnectTries} Tries)`)
      }
      const calculatedReconnectTime = this.reconnectTime * (!this.reconnectTries ? 1 : this.reconnectTries)
      logger.info(`[DB] Trying to reconnect in ${calculatedReconnectTime}ms, (${this.reconnectTries} Tries)`)
      setTimeout(() => {
        this.init()
        this.reconnectTries++
      }, calculatedReconnectTime)
    })
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
