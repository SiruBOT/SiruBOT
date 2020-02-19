const Mongo = require('mongoose')
const uuid = require('node-uuid')

class DataManager {
  constructor (client) {
    this.client = client
    this.connection = Mongo.connection
    this.Models = require('../models')
    this.collections = {
      member: 'Member',
      user: 'User',
      guild: 'Guild',
      error: 'ErrorInfo'
    }
    this.methods = {
      check: 'Check',
      update: 'Update',
      remove: 'Remove',
      add: 'Add'
    }
    this.classPrefix = '[DataBase'
    this.defaultPrefix = {
      init: `${this.classPrefix}:Init]`,
      checkMember: `${this.classPrefix}:${this.methods.check}:${this.collections.member}]`,
      checkUser: `${this.classPrefix}:${this.methods.check}:${this.collections.user}]`,
      checkGuild: `${this.classPrefix}:${this.methods.check}:${this.collections.guild}]`,
      removeGuild: `${this.classPrefix}:${this.methods.remove}:${this.collections.guild}]`,
      removeMember: `${this.classPrefix}:${this.methods.remove}:${this.collections.member}]`,
      addErrorInfo: `${this.classPrefix}:${this.methods.add}:${this.collections.error}`
    }
  }

  /**
   * Connect DataBase by client's Configuration
   */
  init () {
    const { _options, logger } = this.client
    logger.info(`${this.defaultPrefix.init} Connecting URL (${_options.db.mongo.mongoURL})`)
    Mongo.connect(_options.db.mongo.mongoURL, { useNewUrlParser: true, useUnifiedTopology: true, user: _options.db.mongo.user, pass: _options.db.mongo.password })
  }

  /**
   * @param {String} memberID - guildMember id to check
   * @param {String} guildID - guildMember's guild id to check
   * @description - Checks if guildMember is not exists, create document, or do nothing
   * @returns {void}
   */
  async checkMember (memberID, guildID) {
    if (!memberID || !guildID) return new Error('memberID or guildID is not provided.')
    const formattedMemberID = this.getMemberID(memberID, guildID)
    this.client.logger.debug(`${this.defaultPrefix.checkMember} (${formattedMemberID}) Checking Member`)
    const mongoResult = await this.connection.collection('guildMember').findOne({ _id: formattedMemberID })
    if (!mongoResult) {
      this.client.logger.info(`${this.defaultPrefix.checkMember} (${formattedMemberID}) Member does not exist, create one.`)
      new this.Models.Member({
        _id: formattedMemberID
      }).save()
      this.client.logger.debug(`${this.defaultPrefix.checkMember} (${formattedMemberID}) Saving...`)
    }
  }

  /**
   * @param {String} userID - User's id to check
   * @description - Checks if globalUser is not exists, create document, or do nothing
   * @returns {void}
   */
  async checkUser (userID) {
    if (!userID) return new Error('userID is not provided')
    this.client.logger.debug(`${this.defaultPrefix.checkUser} (${userID}) Checking GlobalMember`)
    const mongoResult = await this.connection.collection('globalUser').findOne({ _id: userID })
    if (!mongoResult) {
      this.client.logger.info(`${this.defaultPrefix.checkUser} (${userID}) Global Member is not exist, create one.`)
      new this.Models.User({
        _id: userID
      }).save()
      this.client.logger.debug(`${this.defaultPrefix.checkUser} (${userID}) Saving...`)
    }
  }

  /**
   * @param {String} guildID - Guild's id to check
   * @description - Checks if guild is not exists, create document, or do nothing
   * @returns {void}
   */
  async checkGuild (guildID) {
    if (!guildID) return new Error('guildID is not provided')
    this.client.logger.debug(`${this.defaultPrefix.checkGuild} (${guildID}) Checking Guild`)
    const mongoGuild = await this.connection.collection('guild').findOne({ _id: guildID })
    if (!mongoGuild) {
      this.client.logger.info(`${this.defaultPrefix.checkGuild} (${guildID}) Guild is not exist, create one.`)
      const Model = new this.Models.Guild({
        _id: guildID
      })
      await Model.save()
      this.client.logger.debug(`${this.defaultPrefix.checkGuild} (${guildID}) Saving...`)
    }
  }

  /**
   * @param {String} guildID - Guild's id to remove
   * @description - Remove Guild Document provided guildID
   * @returns {void}
   */
  async removeGuild (guildID) {
    if (!guildID) return new Error('guildID is not provided')
    this.client.logger.debug(`${this.defaultPrefix.removeGuild} (${guildID}) Removing Guild From Database..`)
    const res = await this.connection.collection('guild').deleteOne({ _id: guildID })
    this.client.logger.debug(`${this.defaultPrefix.removeGuild} (${guildID}) Removed Guild From DataBase. (${JSON.stringify(res)}`)
  }

  /**
   * @param {String} memberID - guildMember's user id to remove
   * @param {String} guildID - guildMember's guild id to remove
   * @description - Remove guildMember Document provided guildMemberID
   * @returns {void}
   */
  async removeMember (memberID, guildID) {
    if (!memberID || !guildID) return new Error('memberID or guildID is not provided.')
    const formattedMemberID = this.getMemberID(memberID, guildID)
    this.client.logger.debug(`${this.defaultPrefix.removeMember} (${formattedMemberID}) Removing GlobalMember from Database..`)
    const res = await this.connection.collection('guildMember').deleteOne({ _id: formattedMemberID })
    this.client.logger.debug(`${this.defaultPrefix.removeMember} Removed Member From DataBase. (${formattedMemberID}) (${JSON.stringify(res)})`)
  }

  /**
   * @param {String} name - Error message
   * @param {String} stack - Error Stack Trace
   * @param {String} author - Error Author (Command Message Author ID)
   * @param {String} guild - Error Guild (Command Message's guildID)
   * @param {String} command - Command Name (In Command Message)
   * @param {Array} args - Command Args
   * @returns {String} - UUID of ErrorInformation
   */
  addErrorInfo (name, stack, author, guild, command, args) {
    const createdUUID = uuid.v4()
    this.client.logger.info(`${this.defaultPrefix.addErrorInfo} Added ErrorInfo [UUID: ${createdUUID}]`)
    const Model = new this.Models.ErrorInfo({
      _id: createdUUID,
      name,
      stack,
      author,
      guild,
      command,
      args
    })
    Model.save()
    this.client.logger.debug(`${this.defaultPrefix.addErrorInfo} (${createdUUID}) Saving...`)
    return createdUUID
  }

  /**
   * @param {String} guildID - guilldID to get data
   */
  async getGuild (guildID) {
    if (!guildID) return new Error('guildID is not provided')
    await this.checkGuild(guildID)
    return this.connection.collection('guild').findOne({ _id: guildID })
  }

  /**
   * @param {String} userID - userID to get data
   */
  async getUser (userID) {
    if (!userID) return new Error('userID is not provided')
    await this.checkUser(userID)
    return this.connection.collection('globalUser').findOne({ _id: userID })
  }

  /**
   * @param {String} memberID - memberID to get guildMemberData
   * @param {String} guildID - guildID to get guildMemberData
   */
  async getMember (memberID, guildID) {
    if (!memberID || !guildID) return new Error('memberID or guildID is not provided.')
    await this.checkMember(memberID, guildID)
    return this.connection.collection('guildMember').findOne({ _id: this.getMemberID(memberID, guildID) })
  }

  /**
   * @param {String} guildID - guildID to update
   * @param {Object} query - mongodb Query
   */
  async updateGuild (guildID, query) {
    if (!guildID) return new Error('guildID is not provided')
    await this.checkGuild(guildID)
    return this.connection.collection('guild').updateOne({ _id: guildID }, query)
  }

  /**
   * @param {String} userID - userID to update
   * @param {Object} query - mongodb Query
   */
  async updateUser (userID, query) {
    if (!userID) return new Error('userID is not provided')
    await this.checkUser(userID)
    return this.connection.collection('globalUser').updateOne({ _id: userID }, query)
  }

  /**
   * @param {String} memberID - memberID to update
   * @param {String} guildID - guildID to update
   * @param {Object} query - mongodb Query
   */
  async updateMember (memberID, guildID, query) {
    if (!memberID || !guildID) return new Error('memberID or guildID is not provided.')
    await this.checkMember(memberID, guildID)
    return this.connection.collection('guildMember').updateOne({ _id: this.getMemberID(memberID, guildID) }, query)
  }

  getMemberID (userID, guildID) {
    return `${userID}-${guildID}`
  }
}
module.exports = DataManager
