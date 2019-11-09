const Permissonchecker = require('../modules/perMissionChecker')
class Event {
  constructor (client) {
    this.client = client
    this.permissonChecker = new Permissonchecker(client)
  }

  async run (message) {
    this.handleCommand(message)
  }

  async handleCommand (message) {
    if (message.author.bot) return
    if (message.channel.type === 'dm') return this.sendNotAbleDM(message)
    if (message.guild && !message.member) await message.guild.fetchMember(message.author)
    await this.client.database.checkGuild(message.guild)
    await this.client.database.checkGuildMember(message.member)
    await this.client.database.checkGlobalMember(message.author)
    if (message.content.startsWith(this.client._options.bot.prefix)) {
      const GlobalUserData = await this.client.database.getGlobalUserData(message.author)
      const GuildMemberData = await this.client.database.getGuildMemberData(message.member)
      const GuildData = await this.client.database.getGuildData(message.guild.id)
      const args = message.content.slice(this.client._options.bot.prefix.length).trim().split(/ +/g)
      const command = args.shift().toLowerCase()
      const otherData = {
        GlobalUserData: GlobalUserData,
        GuildMemberData: GuildMemberData,
        GuildData: GuildData
      }
      const userPermissions = this.permissonChecker.getUserPermission(message.member, otherData)
      const compressed = {
        GlobalUserData: GlobalUserData,
        GuildMemberData: GuildMemberData,
        GuildData: GuildData,
        message: message,
        args: args,
        userPermissions: userPermissions
      }

      const Command = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command))
      if (Command) {
        let ablePermissons = 0
        for (const userPerm of userPermissions) {
          if (Command.command.permissions.includes(userPerm)) {
            ablePermissons++
            return Command.run(compressed)
          }
        }
        if (ablePermissons === 0) {
          message.channel.send(`권한없자나, 필요한권한: ${Command.command.permissions.join(' + ')}`)
        }
      }
    }
  }

  sendNotAbleDM (message) {
    message.channel.send('❎  DM 에서는 명령어를 사용하실수 없어요..')
  }
}
module.exports = Event

module.exports.info = {
  event: 'message'
}
