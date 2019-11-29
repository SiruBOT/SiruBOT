class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'setdj',
      aliases: ['ㄴㄷㅅ어'],
      category: 'MUSIC_DJ',
      permissions: ['Administrator', 'DJ']
    }
  }

  async run (compressed) {
  }
}

module.exports = Command
