class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'settc',
      aliases: ['ㄴㄷㅅㅅㅊ'],
      category: 'MUSIC_DJ',
      permissions: ['Administrator', 'DJ']
    }
  }

  async run (compressed) {
  }
}

module.exports = Command
