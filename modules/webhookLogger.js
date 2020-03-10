const Discord = require('discord.js')
class WebHookLogger {
  constructor () {
    this.client = new Discord.WebhookClient()
  }
}
