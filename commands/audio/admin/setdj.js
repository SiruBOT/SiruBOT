class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'setdj',
      aliases: ['ㄴㄷㅅ어'],
      permissions: ['Administrator']
    }
  }

  async run (compressed) {
  }
}

module.exports = Command
