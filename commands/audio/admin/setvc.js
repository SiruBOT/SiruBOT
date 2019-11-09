class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'setvc',
      aliases: ['ㄴㄷㅅㅍㅊ'],
      permissions: ['Administrator']
    }
  }

  async run (compressed) {
  }
}

module.exports = Command
