class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'settc',
      aliases: ['ㄴㄷㅅㅅㅊ'],
      description: '택스트 채널 설정',
      permissions: ['Administrator']
    }
  }

  async run (compressed) {
  }
}

module.exports = Command
