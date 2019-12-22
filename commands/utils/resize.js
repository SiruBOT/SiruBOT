class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'resize',
      aliases: ['ㄱ댜냨ㄷ', '크기조정'],
      category: 'COMMANDS_GENERAL_UTILS',
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  run (compressed) {
    const { message } = compressed
  }
}
module.exports = Command
