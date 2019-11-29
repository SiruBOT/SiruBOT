class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'setvc',
      aliases: ['ㄴㄷㅅㅍㅊ'],
      category: 'MUSIC_DJ',
      permissions: ['Administrator', 'DJ']
    }
  }

  async run (compressed) {
  }
}

module.exports = Command
