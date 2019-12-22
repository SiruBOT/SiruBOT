const Mongo = require('mongoose')

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
    this.client.logger.debug(`[DataBase] [Check] [GuildMember] (${this.getGuildMemberID(guildMember, guildMember.guild)}) Checking GuildMember`)
    const mongoResult = await this.connection.collection('guildMember').findOne({ _id: this.getGuildMemberID(guildMember, guildMember.guild) })
    if (!mongoResult) {
      this.client.logger.info(`[DataBase] [Check] [GuildMember] (${this.getGuildMemberID(guildMember, guildMember.guild)}) GuildMember does not exist, create one.`)
      const Model = new this.Models.GuildMember({
        _id: this.getGuildMemberID(guildMember, guildMember.guild)
      })
      await Model.save()
      this.client.logger.debug(`[DataBase] [Check] [GuildMember] (${this.getGuildMemberID(guildMember, guildMember.guild)}) Saving...`)
    }
  }

  async checkGlobalMember (guildMember) {
    this.client.logger.debug(`[DataBase] [Check] [GlobalMember] (${guildMember.id}) Checking GlobalMember`)
    const mongoResult = await this.connection.collection('globalMember').findOne({ _id: guildMember.id })
    if (!mongoResult) {
      this.client.logger.info(`[DataBase] [Check] [GlobalMember] (${guildMember.id}) Global Member is not exist, create one.`)
      const Model = new this.Models.GlobalMember({
        _id: guildMember.id
      })
      await Model.save()
      this.client.logger.debug(`[DataBase] [Check] [GlobalMember] (${guildMember.id}) Saving...`)
    }
  }

  async checkGuild (guild) {
    this.client.logger.debug(`[DataBase] [Check] [Guild] (${guild.id}) Checking Guild`)
    const mongoGuild = await this.connection.collection('guild').findOne({ _id: guild.id })
    if (!mongoGuild) {
      this.client.logger.info(`[DataBase] [Check] [Guild] (${guild.id}) Guild is not exist, create one.`)
      const Model = new this.Models.Guild({
        _id: guild.id
      })
      await Model.save()
      this.client.logger.debug(`[DataBase] [Check] [Guild] (${guild.id}) Saving...`)
    }
  }

  async deleteGuild (guild) {
    this.client.logger.debug(`[DataBase] [Remove] [Guild] (${guild.id}) Removing Guild From Database..`)
    const res = await this.connection.collection('guild').deleteOne({ _id: guild.id })
    this.client.logger.debug(`[DataBase] [Remove] [Guild] (${guild.id}) Removed Guild From DataBase. (${JSON.stringify(res)}`)
  }

  async deleteGuildMember (member) {
    this.client.logger.debug(`[DataBase] [Remove] [GuildMember] (${this.getGuildMemberID(member, member.guild)}) Removing GlobalMember from Database..`)
    const res = await this.connection.collection('guildMember').deleteOne({ _id: this.getGuildMemberID(member, member.guild) })
    this.client.logger.debug(`[DataBase] [Remove] [GuildMember] Removed GuildMember From DataBase. (${this.getGuildMemberID(member, member.guild)}) (${JSON.stringify(res)})`)
  }

  async getGuildData (id) {
    const guildData = this.connection.collection('guild').findOne({ _id: id })
    return guildData
  }

  async getGlobalUserData (user) {
    const userData = await this.connection.collection('globalMember').findOne({ _id: user.id })
    return userData
  }

  async getGuildMemberData (member) {
    const guildMemberData = this.connection.collection('guildMember').findOne({ _id: this.getGuildMemberID(member, member.guild) })
    return guildMemberData
  }

  async updateGuildData (guild, query) {
    const updated = await this.connection.collection('guild').updateOne({ _id: guild }, query)
    return updated
  }

  async updateGlobalUserData (member, query) {
    const updated = await this.connection.collection('globalMember').updateOne({ _id: member.id }, query)
    return updated
  }

  getGuildMemberID (user, guild) {
    return `${user.id}-${guild.id}`
  }
}
module.exports = DataManager
