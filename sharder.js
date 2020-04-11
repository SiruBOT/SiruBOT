const { ShardingManager, WebhookClient, MessageEmbed } = require('discord.js')
const osu = require('node-os-utils')
const { getSettings } = require('./src/utils')
const { Logger } = require('./src/structures')
const settings = getSettings()
const manager = new ShardingManager('./src/index.js', { token: settings.bot.token, totalShards: settings.bot.shards, respawn: true })
const logger = new Logger()
class WebhookLogger {
  constructor (id, token) {
    this.webhookClient = new WebhookClient(id, token)
  }

  _send (...params) {
    this.webhookClient.send(...params)
      .catch((e) => {
        logger.error('Error on sending Webhook Message!\n' + e.stack || e.message)
      })
  }

  async info (title, desc) {
    return this._send(await this.getEmbed(title, desc, 'good'))
  }

  async warn (title, desc) {
    return this._send(await this.getEmbed(title, desc, 'warn'))
  }

  async fatal (title, desc) {
    return this._send(await this.getEmbed(title, desc, 'fatal'))
  }

  async getEmbed (title, desc, color = 'general') {
    const embed = new MessageEmbed().setColor(settings.embed[color])
    if (title) embed.setTitle(title)
    if (desc) embed.setDescription(desc)
    else embed.setDescription(await this.getSystemInfo())
    return embed
  }

  async getSystemInfo () {
    const memStat = await osu.mem.info()
    const inOut = await osu.netstat.inOut().catch(null)
    return `CPU Average: **${await osu.cpu.usage()}%**
    Memory: **${memStat.usedMemMb}**/**${memStat.totalMemMb} MB**, **${memStat.freeMemPercentage}% (${memStat.freeMemMb}MB) Free**
    ${!inOut ? '' : `Network IO: **${inOut.total.inputMb}MB** / **${inOut.total.outputMb}MB**`}`
  }
}
const hookLogger = new WebhookLogger(settings.webhook.info.id, settings.webhook.info.token)

manager.on('shardCreate', shard => {
  setUpEvents(shard)
  logger.warn(`[Sharding] Successfully Launched Shard of ${shard.id}!`)
  if (settings.bot.shards - 1 === shard.id) {
    logger.warn(`[Sharding] Successfully Launched all shards! (${settings.bot.shards} shards)`)
  }
})

manager.spawn()

function setUpEvents (shard) {
  shard.on('ready', () => hookLogger.warn(`[Shard ${shard.id}] Shard Ready`))
  shard.on('error', (error) => {
    hookLogger.fatal(`[Shard ${shard.id}] Shard Error`, `\`\`\`js\n${error.stack.substring(0, 1000) || error.message.substring(0, 1000)}\`\`\``)
    logger.error(error.stack || error.message)
  })
  shard.on('reconnecting', () => hookLogger.warn(`[Shard ${shard.id}] Shard reconnecting`))
  shard.on('spawn', () => hookLogger.info(`[Shard ${shard.id}] Shard spawned`))
  shard.on('death', () => hookLogger.fatal(`[Shard ${shard.id}] Shard death`))
  shard.on('disconnect', () => hookLogger.fatal(`[Shard ${shard.id}] Shard disconnected`))
}
