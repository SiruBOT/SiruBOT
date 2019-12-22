class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'gookbap',
      aliases: ['국밥'],
      category: 'COMMANDS_GENERAL_UTILS',
      require_voice: false,
      hide: false,
      permissions: ['Everyone']
    }
  }

  run (compressed) {
    const { message, args } = compressed
    message.channel.send(`> <:gookbab:658357875843792942>  **국밥 계산기**\n> <:gookbab:658357875843792942>  국밥의 가격 ${args[0]} 원\n> <:gookbab:658357875843792942>  소비한 가격: ${args[1]} 원\n> <:gookbab:658357875843792942>  국밥 \`\`${(args[1] / args[0]).toFixed(2)}\`\` 그릇`)
  }
}
module.exports = Command
