const Mongo = require('mongoose')
const Models = require('../constant/models')
const uuid = require('node-uuid')

class DataBase {
  constructor (client) {
    this.client = client
    this.connection = Mongo.connection
    // Constants
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
    const { _options, logger } = this.client
    logger.info(`${this.defaultPrefix.init} Connecting URL (${_options.db.mongo.mongoURL})`)
    Mongo.connect(_options.db.mongo.mongoURL, { useNewUrlParser: true, useUnifiedTopology: true, user: _options.db.mongo.user, pass: _options.db.mongo.password })
      .catch(e => {
        logger.error(e)
        logger.error('[DB] Failed To Initialize Database.')
      })
  }

  /**
   * @description Get Guild via guildId, Is guild is not exists, create one
   * @param {String} guildID - guild id to get
   */
  async getGuild (guildID) {
    if (!guildID) throw new Error(`${this.defaultPrefix.getGuild} Guild ID Required`)
    if (typeof guildID !== 'string') throw new Error(`${this.defaultPrefix.getGuild} Guild ID is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.getGuild} Get guild via guildID: ${guildID}`)
    let data = await this.connection.collection('guild').findOne({ _id: guildID })
    if (!data) {
      try {
        this.client.logger.debug(`${this.defaultPrefix.getGuild} Get guild via guildID: ${guildID}, but guild is not exists, create one.`)
        data = await new Models.Guild({
          _id: guildID
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
   * @param {String} userID - user id to get
   */
  async getUser (userID) {
    if (!userID) throw new Error(`${this.defaultPrefix.getUser} User ID Required`)
    if (typeof userID !== 'string') throw new Error(`${this.defaultPrefix.getUser} User ID is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.getUser} Get user via userID: ${userID}`)
    let data = await this.connection.collection('globalUser').findOne({ _id: userID })
    if (!data) {
      try {
        this.client.logger.debug(`${this.defaultPrefix.getUser} Get user via userID: ${userID}, but user is not exists, create one.`)
        data = await new Models.User({
          _id: userID
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
   * @param {String} memberID - member id to get
   * @param {String} guildID - guild id to get
   */
  async getMember (memberID, guildID) {
    if (!memberID) throw new Error(`${this.defaultPrefix.getMember} Member ID Required`)
    if (!guildID) throw new Error(`${this.defaultPrefix.getMember} Guild Id Required`)
    if (typeof memberId !== 'string') throw new Error(`${this.defaultPrefix.getMember} Member ID is must be a string`)
    if (typeof guildID !== 'string') throw new Error(`${this.defaultPrefix.getMember} Guild ID is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.getMember} Get member via memberID: ${memberID} & guildID: ${guildID}`)
    const formattedMemberID = this._getMemberID(memberID, guildID)
    let data = await this.connection.collection('guildMember').findOne({ _id: formattedMemberID })
    if (!data) {
      try {
        this.client.logger.debug(`${this.defaultPrefix.getMember} Get member via memberID: ${memberID} & guildID: ${guildID}, but member is not exists, create one.`)
        data = await new Models.Member({
          _id: formattedMemberID
        }).save()
      } catch (e) {
        this.client.logger.error(`${this.defaultPrefix.getMember} Failed to create member data, ${e.stack}`)
        throw new Error('Failed to create member data')
      }
    }
  }

  /**
   * @description Update Guild Document via query
   * @param {String} guildID - guild id to update
   * @param {Object} query - query to update
   */
  async updateGuild (guildID, query) {
    if (!guildID) throw new Error(`${this.defaultPrefix.updateGuild} Guild ID Required`)
    if (!query) throw new Error(`${this.defaultPrefix.updateGuild} Query Required`)
    if (typeof guildID !== 'string') throw new Error(`${this.defaultPrefix.updateGuild} Guild ID is must be a string`)
    if (typeof query !== 'object') throw new Error(`${this.defaultPrefix.updateGuild} Query is must be a object`)
    this.client.logger.debug(`${this.defaultPrefix.updateGuild} Update Guild: ${guildID}, Query: ${JSON.stringify(query)}`)
    return this.connection.collection('guild').updateOne({ _id: guildID }, query)
  }

  /**
   * @description Update User Document via query
   * @param {String} userID - user id to update
   * @param {Object} query - query to update
   */
  async updateUser (userID, query) {
    if (!userID) throw new Error(`${this.defaultPrefix.updateUser} User ID Required`)
    if (!query) throw new Error(`${this.defaultPrefix.updateUser} Query Required`)
    if (typeof userID !== 'string') throw new Error(`${this.defaultPrefix.updateUser} User ID is must be a string`)
    if (typeof query !== 'object') throw new Error(`${this.defaultPrefix.updateUser} Query is must be a object`)
    this.client.logger.debug(`${this.defaultPrefix.updateUser} Update User: ${userID}, Query: ${JSON.stringify(query)}`)
    return this.connection.collection('globalUser').updateOne({ _id: userID }, query)
  }

  /**
   * @description Update User Document via query
   * @param {String} userID - user id to update
   * @param {Object} query - query to update
   */
  async updateMember (memberID, guildID, query) {
    if (!memberID) throw new Error(`${this.defaultPrefix.updateMember} Member ID Required`)
    if (!guildID) throw new Error(`${this.defaultPrefix.updateMember} Guild ID Required`)
    if (!query) throw new Error(`${this.defaultPrefix.updateUser} Query Required`)
    if (typeof memberID !== 'string') throw new Error(`${this.defaultPrefix.updateMember} Member ID is must be a string`)
    if (typeof guildID !== 'string') throw new Error(`${this.defaultPrefix.updateMember} Guild ID is must be a string`)
    if (typeof query !== 'object') throw new Error(`${this.defaultPrefix.updateMember} Query is must be a object`)
    this.client.logger.debug(`${this.defaultPrefix.updateMember} Update Member: ${this._getMemberID(memberID, guildID)}, Query: ${JSON.stringify(query)}`)
    return this.connection.collection('guildMember').updateOne({ _id: this._getMemberID(memberID, guildID) }, query)
  }

  /**
   * @description Removes guild document from db
   * @param {String} guildID guild id to remove
   */
  async removeGuild (guildID) {
    if (!guildID) throw new Error(`${this.defaultPrefix.removeGuild} Guild ID Required`)
    if (typeof guildID !== 'string') throw new Error(`${this.defaultPrefix.removeGuild} Guild ID is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.removeGuild} Removed Guild: ${guildID}`)
    return this.connection.collection('guild').findOneAndDelete({ _id: guildID })
  }

  /**
   * @description Removes playlist document from db
   * @param {String} playlistID
   */
  async removeUserPlayList (playlistID) {
    if (!playlistID) throw new Error(`${this.defaultPrefix.removeUserPlayList} playlist ID Required`)
    if (typeof playlistID !== 'string') throw new Error(`${this.defaultPrefix.removeUserPlayList} playlist ID is must be a string`)
    this.client.logger.debug(`${this.defaultPrefix.removeUserPlayList} Removed Guild: ${playlistID}`)
    return this.connection.collection('userPlayList').findOneAndDelete({ _id: playlistID })
  }

  /**
   * @param {String} type - Error Type (default, audioError, commandError)
   * @param {String} name - Error message
   * @param {String} stack - Error Stack Trace
   * @param {String} author - Error Author (Command Message Author ID)
   * @param {String} guild - Error Guild (Command Message's guildID)
   * @param {String} command - Command Name (In Command Message)
   * @param {Array} args - Command Args
   * @returns {String} - UUID of ErrorInformation
   */
  addErrorInfo (type = 'default', name, stack, author, guild, command, args) {
    const createdUUID = uuid.v4()
    this.client.logger.info(`${this.defaultPrefix.addErrorInfo} Added ErrorInfo UUID: ${createdUUID}`)
    new Models.ErrorInfo({
      _id: createdUUID,
      type,
      name,
      stack,
      author,
      guild,
      command,
      args
    }).save()
    return createdUUID
  }

  /**
   * @param {String} authorId - Author ID
   */
  async getPlaylistsByAuthorID (authorId) {
    if (!authorId) throw new Error('AuthorID Required')
    return Models.UserPlayList.find({ authorID: authorId })
  }

  /**
   * @param {String} name - Playlist Name
   * @param {String} author Author ID
   * @param {Array} tracks Tracks
   */
  async addUserPlayList (name, author, tracks = []) {
    if (!name) throw new Error(`${this.defaultPrefix.addUserPlayList} Name is required`)
    if (name.length > 32) throw new Error(`${this.defaultPrefix.addUserPlayList} Name can't longer than 32 char`)
    if (!author) throw new Error(`${this.defaultPrefix.addUserPlayList} Author Id is required`)
    if (!Array.isArray(tracks)) throw new Error(`${this.defaultPrefix.addUserPlayList} Tracks is must be a Array`)
    const playListID = this._makeID(5)
    if (await Models.UserPlayList.find({ _id: playListID }).length > 0) return this.addUserPlayList(name, author, tracks) // Avoid Duplicated _id property
    this.client.logger.debug(`${this.defaultPrefix.addUserPlayList} Added User Playlist, ID: ${playListID}`)
    const Model = new Models.UserPlaylist({
      _id: playListID,
      name: name,
      authorID: author,
      tracks: tracks
    })
    return Model.save()
  }

  /**
   * @description returns Member ID Formatted like `userID-guildID`
   * @param {String} userID - userId to get memberID
   * @param {String} guildID - guildId to get memberID
   */
  _getMemberID (userID, guildID) {
    return `${userID}-${guildID}`
  }

  /**
   * @description make random id
   * @param {Number} length - length to make id
   */
  _makeID (length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }
}

module.exports = DataBase
