const Discord = require('discord.js')
const path = require('path')
class ServerLogger {
  constructor (client) {
    this.client = client
    this.events = new Discord.Collection()
  }

  /**
   * @description - Emits Event, args to server (ID)
   * @param {String} name - event name
   * @param {Discord.Guild} guildId - guild object
   * @param {Array} args - event's args
   */
  async send (name, guild, ...args) {
    this.client.logger.info(`[GuildLoggerManager] Executing Event ${name}, In guild ${guild.id}, args ${args}`)
    if (this.events.keyArray().includes(name)) {
      const guildData = await this.client.database.getGuildData(guild.id)
      const nameIndex = guildData.enabledEvents.findIndex(el => el.name === name)
      if (nameIndex !== -1) {
        this.events.get(name).run({ guild, args, guildData, eventData: guildData.enabledEvents[nameIndex] })
      }
    }
  }

  async init () {
    this.client.logger.info('[GuildLoggerManager] Init GuildLoggerManager...')
    const events = await this.client.utils.asyncFunc.globAsync('./modules/logging/loggerEvents/**/*.js')
    this.client.logger.debug(`[GuildLoggerManager] Loading Events ${events}`)
    for (const item of events) {
      this.client.logger.debug(`[GuildLoggerManager] Loading Event ${item}`)
      this.LoadEvent(item)
    }
  }

  LoadEvent (eventPath) {
    if (!eventPath.split('/').slice(-1)[0].startsWith('!')) {
      const Event = require(path.join(process.cwd(), eventPath))
      const event = new Event(this.client)
      this.client.logger.debug(`[GuildLoggerManager] Loading Event (${event.event.name})`)
      this.events.set(event.event.name, event)
      delete require.cache[require.resolve(path.join(process.cwd(), eventPath))]
    } else {
      this.client.logger.warn(`[GuildLoggerManager] Ignore file ${eventPath} (Starts !)`)
    }
  }
}

module.exports = ServerLogger
