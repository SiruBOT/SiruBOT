// TODO: Translate it,
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

  async run (compressed) {
    const { message, args } = compressed
    if (!args[0]) return message.channel.send('국밥의 가격을 입력해주세요.')
    if (!args[1]) return message.channel.send('소비한 금액을 입력해주세요.')
    if (args[0] < 1) return message.channel.send('국밥의 가격은 1원보다 작을수 없습니다!')
    if (args[1] < 1) return message.channel.send('소비한 금액은 1원보다 작을수 없습니다!')
    message.channel.send(`> <:gookbab:658357875843792942>  **국밥 계산기**\n> <:gookbab:658357875843792942>  국밥의 가격 ${args[0]} 원\n> <:gookbab:658357875843792942>  소비한 가격: ${args[1]} 원\n> <:gookbab:658357875843792942>  국밥 \`\`${(args[1] / args[0]).toFixed(2)}\`\` 그릇`)
  }
}
module.exports = Command
