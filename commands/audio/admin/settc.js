class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'settc',
      aliases: ['ㄴㄷㅅㅅㅊ'],
      permissions: ['Administrator']
    }
  }

  async run (compressed) {
  }
}

module.exports = Command
