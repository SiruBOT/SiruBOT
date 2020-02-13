const Mongo = require('mongoose')
const uuid = require('node-uuid')

class DataManager {
  constructor (client) {
    this.client = client
    this.connection = Mongo.connection
    this.Models = require('../models')
  }

  init () {
    const options = this.client._options
    const logger = this.client.logger
    logger.info(`[DataBase] [INIT] Connecting URL (${options.db.mongo.mongoURL})`)
    Mongo.connect(options.db.mongo.mongoURL, { useNewUrlParser: true, useUnifiedTopology: true, user: options.db.mongo.user, pass: options.db.mongo.password })
  }

  async checkGuildMember (guildMember) {
    this.client.logger.debug(`[DataBase:GuildMember:Check] (${this.getGuildMemberID(guildMember, guildMember.guild)}) Checking GuildMember`)
    const mongoResult = await this.connection.collection('guildMember').findOne({ _id: this.getGuildMemberID(guildMember, guildMember.guild) })
    if (!mongoResult) {
      this.client.logger.info(`[DataBase:GuildMember:Check] (${this.getGuildMemberID(guildMember, guildMember.guild)}) GuildMember does not exist, create one.`)
      const Model = new this.Models.GuildMember({
        _id: this.getGuildMemberID(guildMember, guildMember.guild)
      })
      await Model.save()
      this.client.logger.debug(`[DataBase:GuildMember:Check] (${this.getGuildMemberID(guildMember, guildMember.guild)}) Saving...`)
    }
  }

  async checkGlobalMember (guildMember) {
    this.client.logger.debug(`[DataBase:GlobalMember:Check] (${guildMember.id}) Checking GlobalMember`)
    const mongoResult = await this.connection.collection('globalMember').findOne({ _id: guildMember.id })
    if (!mongoResult) {
      this.client.logger.info(`[DataBase:GlobalMember:Check] (${guildMember.id}) Global Member is not exist, create one.`)
      const Model = new this.Models.GlobalMember({
        _id: guildMember.id
      })
      await Model.save()
      this.client.logger.debug(`[DataBase:GlobalMember:Check] (${guildMember.id}) Saving...`)
    }
  }

  async checkGuild (guild) {
    this.client.logger.debug(`[DataBase:Guild:Check] (${guild}) Checking Guild`)
    const mongoGuild = await this.connection.collection('guild').findOne({ _id: guild })
    if (!mongoGuild) {
      this.client.logger.info(`[DataBase:Guild:Check] (${guild}) Guild is not exist, create one.`)
      const Model = new this.Models.Guild({
        _id: guild
      })
      await Model.save()
      this.client.logger.debug(`[DataBase:Guild:Check] (${guild}) Saving...`)
    }
  }

  async deleteGuild (guild) {
    this.client.logger.debug(`[DataBase:Guild:Remove] (${guild.id}) Removing Guild From Database..`)
    const res = await this.connection.collection('guild').deleteOne({ _id: guild.id })
    this.client.logger.debug(`[DataBase:Guild:Remove] (${guild.id}) Removed Guild From DataBase. (${JSON.stringify(res)}`)
  }

  async deleteGuildMember (member) {
    this.client.logger.debug(`[DataBase:GuildMember:Remove] (${this.getGuildMemberID(member, member.guild)}) Removing GlobalMember from Database..`)
    const res = await this.connection.collection('guildMember').deleteOne({ _id: this.getGuildMemberID(member, member.guild) })
    this.client.logger.debug(`[DataBase:GuildMember:Remove] Removed GuildMember From DataBase. (${this.getGuildMemberID(member, member.guild)}) (${JSON.stringify(res)})`)
  }

  addErrorInfo (name, stack, author, guild, command, args) {
    const createdUUID = uuid.v4()
    this.client.logger.info(`[DataBase:ErrorInfo:Create] Added ErrorInfo [UUID: ${createdUUID}]`)
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
    this.client.logger.debug(`[DataBase:ErrorInfo:Create] (${createdUUID}) Saving...`)
    return createdUUID
  }

  async getGuildData (id) {
    await this.checkGuild(id)
    return this.connection.collection('guild').findOne({ _id: id })
  }

  async getGlobalUserData (user) {
    await this.checkGlobalMember(user)
    return this.connection.collection('globalMember').findOne({ _id: user.id })
  }

  async getGuildMemberData (member) {
    await this.checkGuildMember(member)
    return this.connection.collection('guildMember').findOne({ _id: this.getGuildMemberID(member, member.guild) })
  }

  async updateGuildData (guild, query) {
    await this.checkGuild(guild)
    return this.connection.collection('guild').updateOne({ _id: guild }, query)
  }

  async updateGlobalUserData (member, query) {
    await this.checkGlobalMember(member)
    return this.connection.collection('globalMember').updateOne({ _id: member.id }, query)
  }

  async updateGuildMemberData (member, query) {
    await this.checkGuildMember(member)
    return this.connection.collection('guildMember').updateOne({ _id: this.getGuildMemberID(member, member.guild) }, query)
  }

  getGuildMemberID (user, guild) {
    return `${user.id}-${guild.id}`
  }
}
module.exports = DataManager
