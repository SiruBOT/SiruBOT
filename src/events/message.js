const Sentry = require('@sentry/node')
const placeHolderConstant = require('../constant').placeHolderConstant
const Errors = require('../errors')
const { BaseEvent } = require('../structures')

class Event extends BaseEvent {
  constructor (client) {
    super(
      client,
      'message',
      (...args) => this.run(...args)
    )
    this.classPrefix = '[Events:onMessage'
    this.defaultPrefix = {
      handleCommand: `${this.classPrefix}:handleCommand]`
    }
  }

  /**
   * Run Event
   * @param {Object} message - Message
   */
  async run (message) {
    this.handleCommand(message)
  }

  async handleCommand (message) {
    if (message.author.bot) return
    if (message.channel.type === 'dm') return message.channel.send(`${placeHolderConstant.EMOJI_NO}  DM 에서는 명령어를 사용하실수 없어요..\n${placeHolderConstant.EMOJI_NO}  You can't use commands on the DM.`)
    if (message.guild && !message.member) await message.guild.fetchMember(message.author)
    if (!this.client.utils.permissionChecker.checkChannelPermission(message.guild.me, message.channel, ['SEND_MESSAGES'])) return
    const prefix = placeHolderConstant.PREFIX
    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase()
    const commandClass = this.client.commands.get(command) || this.client.commands.get(this.client.aliases.get(command))
    const badConnectionCodes = [0, 2, 3]
    if (badConnectionCodes.includes(this.client.database.connection.readyState) && message.content.startsWith(prefix) && commandClass) {
      const ownerName = this.client.shard ? (await this.client.shard.broadcastEval(`this.users.cache.get("${this.client._options.bot.owners[0]}") ? this.users.cache.get("${this.client._options.bot.owners[0]}").tag : false`)).filter(el => !!el)[0] : this.client.users.cache.get(this.client._options.bot.owners[0]).tag
      await message.channel.send(
      `> ${placeHolderConstant.EMOJI_WARN}  봇이 DB와 연결이 끊어져 사용 불가능한 상태인것 같네요, 개발자에게 연락해주세요!
       > ${placeHolderConstant.EMOJI_WARN}  It seems disconnected from database server, please contact developer! (**${ownerName}**)`
      )
      return
    }
    const guildData = await this.client.database.getGuild(message.guild.id)
    const userData = await this.client.database.getUser(message.author.id)
    const memberData = await this.client.database.getMember(message.member.id, message.guild.id)
    if (message.content.startsWith(prefix)) {
      if (message.author.awaitQuestion) return
      const picker = this.client.utils.localePicker
      const { locale } = guildData
      if (userData.blacklisted && !this.client._options.bot.owners.includes(message.author.id)) return this.client.logger.warn(`${this.defaultPrefix.handleCommand} Blacklisted User Issued Command ${command}, [${args.join(', ')}]`)
      const userPermissions = this.client.utils.permissionChecker.getUserPerm(message.member, {
        userData,
        memberData,
        guildData
      })
      const memberVoice = message.member.voice.channel
      if (memberVoice) {
        const filteredVoice = memberVoice.members.filter(e => !e.user.bot && !(e.voice.serverDeaf || e.voice.selfDeaf))
        if (memberVoice && memberVoice.members && filteredVoice.has(message.member.id) && filteredVoice.size === 1 && !userPermissions.includes('DJ')) userPermissions.push('DJ')
      }
      const compressed = Object.assign({
        userData,
        memberData,
        guildData,
        message,
        args,
        prefix,
        command,
        userPermissions
      })
      if (commandClass) {
        if (userData.cooldownAt && !((userData.cooldownAt.getTime() + 1500) - new Date().getTime() < 0)) return message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_COOLDOWN', { TIME: ((userData.cooldownAt.getTime() + 1500) - new Date().getTime()) / 1000 }))
        await this.client.database.updateUser(message.author.id, { $set: { cooldownAt: new Date() } })
        if (this.client.shuttingDown) return message.channel.send(picker.get(locale, 'UNABLE_USE_COMMAND_SHUTDOWN'))
        if (this.client.chkRightChannel(message.channel, guildData.tch) || message.member.permissions.has('ADMINISTRATOR')) {
          /* Requirements */
          const { requirements } = commandClass
          const { audioNodes, playingStatus, voiceStatus } = requirements
          // Requirements - audioNodes, playingStatus
          if (audioNodes && !await this.client.audio.getNode()) return message.channel.send(picker.get(locale, 'AUDIO_NO_NODES'))
          if (audioNodes && (guildData.tch === '0' || !message.guild.channels.cache.get(guildData.tch)) && !this.client.audio.textChannels.get(message.guild.id)) this.client.audio.textChannels.set(message.guild.id, message.channel.id)
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
          this.client.logger.info(`${this.defaultPrefix.handleCommand} (${message.channel.id}, ${message.id}, ${message.author.id}) Treating command ${commandClass.name} at ${new Date().getTime()}`)
          if (havePermissions.length === 0) return message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_NO_PERMISSIONS', { REQUIRED: commandClass.permissions.join(', ') }))
          try {
            await commandClass.run(compressed)
          } catch (e) {
            if (e instanceof Errors.UsageFailedError) {
              const commandInfo = this.client.commands.get(e.commandName)
              if (commandInfo) {
                return message.channel.send(
                  '> ' + picker.get(locale, 'COMMANDS_HELP_USAGE') + '\n' +
                  '> ```fix\n> ' + picker.get(locale, `USAGE_${commandInfo.category}_${commandInfo.name.toUpperCase()}`, { COMMAND: command }) + '\n> ```'
                )
              }
            }
            if (e instanceof Errors.PermissionError) return message.channel.send(picker.get(locale, 'ERROR_PERMISSION', { PERMS: e.perms.join(', ') }))
            this.client.logger.error(`${this.defaultPrefix.handleCommand} (${message.channel.id}, ${message.id}, ${message.author.id}) Unexpected Error: ${e.name}: ${e.stack}`)
            await message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_ERROR', { UUID: this.client.database.addErrorInfo('commandError', e.name, e.stack, message.author.id, message.guild.id, commandClass.name, args) }))
            await message.channel.send(e.message, { code: 'js', split: '\n' })
            Sentry.captureException(e)
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
            const m = await message.channel.send(picker.get(locale, 'HANDLE_COMMANDS_DEFAULT_TEXT', {
              SERVER: message.guild.name,
              CHANNEL: guildData.tch
            }))
            await m.delete({ timeout: 3000 })
          }
        }
      }
    }
  }
}

module.exports = Event
