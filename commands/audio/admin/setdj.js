class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'setdj',
      aliases: ['ㄴㄷㅅ어'],
      description: 'DJ 역할 설정',
      permissions: ['Administrator']
    }
  }

  async run (compressed) {
  }
}

module.exports = Command
