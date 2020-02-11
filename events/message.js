class Event {
  constructor (client) {
    this.client = client
    this.classPrefix = '[Events:onMessage'
    this.defaultPrefix = {
      handleCommand: `${this.classPrefix}:handleCommand]`
    }
  }

  /**
     * Run Event
     * @param message {Object} - Message
     */
  async run (message) {
    this.handleCommand(message)
  }

  async handleCommand (message) {
    if (message.author.bot) return
    if (message.channel.type === 'dm') return message.channel.send('❎  DM 에서는 명령어를 사용하실수 없어요..\n❎  You can\'t use commands on the DM.')
    if (message.guild && !message.member) await message.guild.fetchMember(message.author)
    // Test
    this.client.redisClient.publish('asdf', JSON.stringify({ message: message.content }))
    // End of Test
    await this.client.database.checkGuild(message.guild)
    await this.client.database.checkGuildMember(message.member)
    await this.client.database.checkGlobalMember(message.author)
    const prefix = this.client._options.bot.prefix
    if (message.content.startsWith(prefix)) {
      const GlobalUserData = await this.client.database.getGlobalUserData(message.author)
      const GuildMemberData = await this.client.database.getGuildMemberData(message.member)
      const GuildData = await this.client.database.getGuildData(message.guild.id)
      const args = message.content.slice(prefix.length).trim().split(/ +/g)
      const command = args.shift().toLowerCase()
      const userPermissions = this.client.utils.permissionChecker.getUserPermission(message.member, { GlobalUserData: GlobalUserData, GuildMemberData: GuildMemberData, GuildData: GuildData })
      const compressed = Object.assign({
        GlobalUserData: GlobalUserData,
        GuildMemberData: GuildMemberData,
        GuildData: GuildData,
        message: message,
        args: args,
        prefix: prefix,
        userPermissions: userPermissions
      })

      const locale = compressed.GuildData.locale
      const picker = this.client.utils.localePicker
      const Command = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command))
      if (Command) {
        let ablePermissions = 0
        if (this.client.chkRightChannel(message.channel, GuildData.tch)) {
          if (Command.command.category.startsWith('MUSIC_')) {
            if (GuildData.tch === '0') this.client.audio.textChannels.set(message.guild.id, message.channel.id)
            if (!this.client.audio.getNode()) return message.channel.send(picker.get(locale, 'AUDIO_NO_NODES'))
          }
          if (Command.command.require_voice) {
            const vch = GuildData.vch
            if (!message.member.voice.channel) return message.channel.send(picker.get(locale, 'AUDIO_JOIN_VOICE_FIRST'))
            if (!this.client.chkRightChannel(message.member.voice.channel, vch)) return message.channel.send(picker.get(locale, 'AUDIO_NOT_DEFAULT_CH', { VOICECHANNEL: vch }))
            if (this.client.audio.utils.getVoiceStatus(message.member).listen === false) return message.channel.send(picker.get(locale, 'AUDIO_LISTEN_PLEASE'))
            if ((message.member.voice.channelID !== null ? message.member.voice.channelID : true) !== (message.guild.me.voice.channelID !== null ? message.guild.me.voice.channelID : true)) return message.channel.send(picker.get(locale, 'AUDIO_SAME_VOICE', { VOICECHANNEL: message.guild.me.voice.channelID }))
          }
          for (const userPerm of userPermissions) {
            if (Command.command.permissions.includes(userPerm)) {
              ablePermissions++
              this.client.logger.debug(`${this.defaultPrefix.handleCommand} (${message.channel.id}, ${message.id}, ${message.author.id}) Treating command ${Command.command.name} at ${new Date().getTime()}`)
              return Command.run(compressed).catch((e) => {
                this.client.logger.error(`${this.defaultPrefix.handleCommand} (${message.channel.id}, ${message.id}, ${message.author.id}) Unexpected Error: ${e.name}: ${e.stack}`)
                const errorUUID = this.client.database.addErrorInfo(e.name, e.stack, message.author.id, message.guild.id, Command.command.name, args)
                message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_ERROR', { UUID: errorUUID }))
              })
            }
          }
          if (ablePermissions === 0) {
            message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_NO_PERMISSIONS', { REQUIRED: Command.command.permissions.join(', ') }))
          }
        } else {
          if (this.client.utils.permissionChecker.checkChannelPermission(message.guild.me, message.channel, ['MANAGE_MESSAGES'])) {
            message.delete()
          }
          message.author.send(picker.get(locale, 'HANDLE_COMMANDS_DEFAULT_TEXT', { SERVER: message.guild.name, CHANNEL: GuildData.tch })).catch((e) => {
            this.client.logger.debug(`${this.defaultPrefix.handleCommand} Author Send Fail.. ${message.author.tag}(${message.author.id})`)
          })
        }
      }
    }
  }
}
module.exports = Event

module.exports.info = {
  event: 'message'
}
