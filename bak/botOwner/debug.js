class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'debug',
      aliases: [],
      description: 'debug',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    const message = compressed.message
    this.client.database.updateGlobalUserData(message.member, { $set: { money: 100000 } })
    message.channel.send('Updated')
  }
}

module.exports = Command
