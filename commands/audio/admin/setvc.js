class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'setvc',
      aliases: ['ㄴㄷㅅㅍㅊ'],
      description: '보이스 채널 설정',
      permissions: ['Administrator']
    }
  }

  async run (compressed) {
  }
}

module.exports = Command
