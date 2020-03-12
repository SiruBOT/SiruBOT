const { ShardingManager } = require('discord.js')
const { Logger, getSettings } = require('./modules')
const logger = new Logger()
const settings = getSettings()
const manager = new ShardingManager('./index.js', { token: settings.bot.token, totalShards: settings.bot.shards })

manager.on('launch', shard => {
  logger.warn(`[Sharding] Successfully Launched Shard of ${shard.id}!`)
  if (settings.bot.shards - 1 === shard.id) {
    logger.warn(`[Sharding] Successfully Launched all shards! (${settings.bot.shards} shards)`)
  }
})

manager.spawn().then(() => {
  manager.broadcast('spawned-all-shards')
})
