class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'debug',
      aliases: [],
      category: 'BOT_OWNER',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const message = compressed.message
    message.channel.send('<:emoji_off:649622462685773884>')
    message.channel.send('<:emoji_on:649622462765596683>')
    message.channel.send(`\uD83D\uDD0A
    \uD83D\uDD09
    \uD83D\uDD08
    \uD83D\uDD07`)
    // this.client.database.updateGlobalUserData(message.member, { $add: { money: 100000 } })
    // message.channel.send('Updated')
  }
}

module.exports = Command
