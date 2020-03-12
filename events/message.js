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
    if (message.channel.type === 'dm') return message.channel.send(`${this.client._options.constructors.EMOJI_NO}  DM 에서는 명령어를 사용하실수 없어요..\n${this.client._options.constructors.EMOJI_NO}  You can\'t use commands on the DM.`)
    if (message.guild && !message.member) await message.guild.fetchMember(message.author)
    if (!message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) return
    // Test
    this.client.redisClient.publish('asdf', JSON.stringify({ message: message.content }))
    // End of Test
    await this.client.database.checkGuild(message.guild.id)
    await this.client.database.checkMember(message.member.id, message.guild.id)
    await this.client.database.checkUser(message.author.id)
    const prefix = this.client._options.bot.prefix
    if (message.content.startsWith(prefix)) {
      const userData = await this.client.database.getUser(message.author.id)
      const args = message.content.slice(prefix.length).trim().split(/ +/g)
      const command = args.shift().toLowerCase()
      if (userData.blacklisted && !this.client._options.bot.owners.includes(message.author.id)) return this.client.logger.warn(`${this.defaultPrefix.handleCommand} Blacklisted User Issued Command ${command}, [${args.join(', ')}]`)
      const memberData = await this.client.database.getMember(message.member.id, message.guild.id)
      const guildData = await this.client.database.getGuild(message.guild.id)
      const userPermissions = this.client.utils.permissionChecker.getUserPerm(message.member, {
        userData,
        memberData,
        guildData
      })
      const compressed = Object.assign({
        userData: userData,
        memberData: memberData,
        guildData: guildData,
        message: message,
        args: args,
        prefix: prefix,
        command: command,
        userPermissions: userPermissions
      })

      const locale = compressed.guildData.locale
      const picker = this.client.utils.localePicker
      const Command = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command))
      if (Command) {
        if (this.client.shuttingDown) return message.channel.send(picker.get(locale, 'UNABLE_USE_COMMAND_SHUTDOWN'))
        let ablePermissions = 0
        if (this.client.chkRightChannel(message.channel, guildData.tch)) {
          if (Command.command.require_nodes) {
            if (guildData.tch === '0') this.client.audio.textChannels.set(message.guild.id, message.channel.id)
            if (!this.client.audio.getNode()) return message.channel.send(picker.get(locale, 'AUDIO_NO_NODES'))
          }
          if (Command.command.require_voice) {
            const vch = guildData.vch
            if (!message.member.voice.channel) return message.channel.send(picker.get(locale, 'AUDIO_JOIN_VOICE_FIRST'))
            if (this.client.audio.utils.getVoiceStatus(message.member).listen === false) return message.channel.send(picker.get(locale, 'AUDIO_LISTEN_PLEASE'))
            if ((message.guild.me.voice.channelID && message.guild.me.voice.channelID !== message.member.voice.channelID)) return message.channel.send(picker.get(locale, 'AUDIO_SAME_VOICE', { VOICECHANNEL: message.guild.me.voice.channelID }))
            if ((message.guild.me.voice.channelID && message.guild.me.voice.channelID !== message.member.voice.channelID) && !this.client.chkRightChannel(message.member.voice.channel, vch)) return message.channel.send(picker.get(locale, 'AUDIO_NOT_DEFAULT_CH', { VOICECHANNEL: vch }))
          }
          for (const userPerm of userPermissions) {
            if (Command.command.permissions.includes(userPerm)) {
              ablePermissions++
              this.client.logger.debug(`${this.defaultPrefix.handleCommand} (${message.channel.id}, ${message.id}, ${message.author.id}) Treating command ${Command.command.name} at ${new Date().getTime()}`)
              try {
                await Command.run(compressed)
                break
              } catch (e) {
                if (e instanceof this.client.utils.errors.PermError) return message.channel.send(picker.get(locale, 'ERROR_PERMISSION', { PERMS: e.perms.join(', ') }))
                this.client.logger.error(`${this.defaultPrefix.handleCommand} (${message.channel.id}, ${message.id}, ${message.author.id}) Unexpected Error: ${e.name}: ${e.stack}`)
                await message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_ERROR', { UUID: this.client.database.addErrorInfo('commandError', e.name, e.stack, message.author.id, message.guild.id, Command.command.name, args) }))
              }
            }
          }
          if (ablePermissions === 0) {
            await message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_NO_PERMISSIONS', { REQUIRED: Command.command.permissions.join(', ') }))
          }
        } else {
          if (this.client.utils.permissionChecker.checkChannelPermission(message.guild.me, message.channel, ['MANAGE_MESSAGES'])) {
            await message.delete()
          }
          try {
            await message.author.send(picker.get(locale, 'HANDLE_COMMANDS_DEFAULT_TEXT', {
              SERVER: message.guild.name,
              CHANNEL: guildData.tch
            }))
          } catch {
            await message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_DEFAULT_TEXT', {
              SERVER: message.guild.name,
              CHANNEL: guildData.tch
            })).delete(3000)
          }
        }
      }
    }
  }
}

module
  .exports = Event

module
  .exports
  .info = {
    event: 'message'
  }
