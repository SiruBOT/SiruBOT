class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'scplay',
      aliases: ['ㄴㅊㅔㅣ묘'],
      description: '사운드클라우드 재생',
      permissions: ['Everyone']
    }
  }

  async run (compressed) {
    this.client.commands.get('play').run(compressed, true)
  }
}

module.exports = Command
