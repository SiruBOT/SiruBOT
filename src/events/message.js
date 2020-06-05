const placeHolderConstructors = require('../constructors').placeHolderConstructors
const Errors = require('../errors')
class Event {
  constructor (client) {
    this.client = client
    this.name = 'message'
    this.listener = (...args) => this.run(...args)
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
    if (message.channel.type === 'dm') return message.channel.send(`${placeHolderConstructors.EMOJI_NO}  DM 에서는 명령어를 사용하실수 없어요..\n${placeHolderConstructors.EMOJI_NO}  You can\'t use commands on the DM.`)
    if (message.guild && !message.member) await message.guild.fetchMember(message.author)
    if (!this.client.utils.permissionChecker.checkChannelPermission(message.guild.me, message.channel, ['SEND_MESSAGES'])) return
    await this.client.database.checkGuild(message.guild.id)
    await this.client.database.checkMember(message.member.id, message.guild.id)
    await this.client.database.checkUser(message.author.id)
    const prefix = placeHolderConstructors.PREFIX
    if (message.content.startsWith(prefix)) {
      if (message.author.awaitQuestion) return
      const picker = this.client.utils.localePicker
      const guildData = await this.client.database.getGuild(message.guild.id)
      const userData = await this.client.database.getUser(message.author.id)
      const { locale } = guildData
      const args = message.content.slice(prefix.length).trim().split(/ +/g)
      const command = args.shift().toLowerCase()
      if (userData.blacklisted && !this.client._options.bot.owners.includes(message.author.id)) return this.client.logger.warn(`${this.defaultPrefix.handleCommand} Blacklisted User Issued Command ${command}, [${args.join(', ')}]`)
      const memberData = await this.client.database.getMember(message.member.id, message.guild.id)
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
      const commandClass = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command))
      if (commandClass) {
        if (this.client.shuttingDown) return message.channel.send(picker.get(locale, 'UNABLE_USE_COMMAND_SHUTDOWN'))
        if (this.client.chkRightChannel(message.channel, guildData.tch)) {
          /**
           * Requirements
           */
          const { requirements } = commandClass
          const { audioNodes, playingStatus, voiceStatus } = requirements
          // Requirements - audioNodes, playingStatus
          if (audioNodes && !this.client.audio.getNode()) return message.channel.send(picker.get(locale, 'AUDIO_NO_NODES'))
          if (audioNodes && guildData.tch === '0' && (!this.client.audio.textChannels.get(message.guild.id) || (this.client.audio.textChannels.get(message.guild.id) && this.client.audio.textChannels.get(message.guild.id).deleted))) this.client.audio.textChannels.set(message.guild.id, message.channel.id)
          if (playingStatus && !this.client.audio.players.get(message.guild.id)) return message.channel.send(picker.get(locale, 'AUDIO_REQUIRE_PLAYING'))
          // Requirements.voiceStatus
          if (voiceStatus) {
            const { listenStatus, sameChannel, voiceIn } = voiceStatus
            const { vch } = guildData
            if (voiceIn && !message.member.voice.channel) return message.channel.send(picker.get(locale, 'AUDIO_JOIN_VOICE_FIRST'))
            if (message.member.voice.channel && (message.guild.me.voice.channelID && message.guild.me.voice.channelID !== message.member.voice.channelID) && !this.client.chkRightChannel(message.member.voice.channel, vch)) return message.channel.send(picker.get(locale, 'AUDIO_NOT_DEFAULT_CH', { VOICECHANNEL: vch }))
            // Requirements.voiceStatus - listenStatus
            if (message.member.voice.channel && listenStatus && this.client.audio.utils.getVoiceStatus(message.member).listen === false) return message.channel.send(picker.get(locale, 'AUDIO_LISTEN_PLEASE'))
            // Requirements.voiceStatus - sameChannel
            if (message.member.voice.channel && sameChannel && (message.guild.me.voice.channelID && message.guild.me.voice.channelID !== message.member.voice.channelID)) return message.channel.send(picker.get(locale, 'AUDIO_SAME_VOICE', { VOICECHANNEL: message.guild.me.voice.channelID }))
          }

          const havePermissions = commandClass.permissions.filter(el => userPermissions.includes(el))
          this.client.logger.debug(`${this.defaultPrefix.handleCommand} (${message.channel.id}, ${message.id}, ${message.author.id}) Treating command ${commandClass.name} at ${new Date().getTime()}`)
          if (havePermissions.length === 0) return message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_NO_PERMISSIONS', { REQUIRED: commandClass.permissions.join(', ') }))
          try {
            await commandClass.run(compressed)
          } catch (e) {
            if (e instanceof Errors.PermissionError) return message.channel.send(picker.get(locale, 'ERROR_PERMISSION', { PERMS: e.perms.join(', ') }))
            this.client.logger.error(`${this.defaultPrefix.handleCommand} (${message.channel.id}, ${message.id}, ${message.author.id}) Unexpected Error: ${e.name}: ${e.stack}`)
            await message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_ERROR', { UUID: this.client.database.addErrorInfo('commandError', e.name, e.stack, message.author.id, message.guild.id, commandClass.name, args) }))
          }
          message.author.awaitQuestion = false
        } else {
          if (this.client.utils.permissionChecker.checkChannelPermission(message.guild.me, message.channel, ['MANAGE_MESSAGES'])) await message.delete()
          try {
            await message.author.send(picker.get(locale, 'HANDLE_COMMANDS_DEFAULT_TEXT', {
              SERVER: message.guild.name,
              CHANNEL: guildData.tch
            }))
          } catch {
            await message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_DEFAULT_TEXT', {
              SERVER: message.guild.name,
              CHANNEL: guildData.tch
            })).then(m => m.delete({ timeout: 3000 }))
          }
        }
      }
    }
  }
}

module.exports = Event
