class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'test',
      description: '테스트',
      aliases: ['testing'],
      permissions: ['Everyone']
    }
  }

  run (compressed) {
    const { args, message } = compressed
    message.channel.send(`args: ${args.join(',')}`)
  }
}

module.exports = Command
