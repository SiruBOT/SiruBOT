class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'reload',
      aliases: ['리로드', 'loadcommands', 'flfhem', 'ㄱ디ㅐㅁㅇ'],
      category: 'BOT_OWNER',
      require_voice: false,
      hide: false,
      permissions: ['BotOwner']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   */
  async run (compressed) {
    const { message } = compressed
    message.channel.send('❎  리로드 중...').then(async m => {
      await this.client.init(true)
      const Data = await this.client.LoadCommands()
      await m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n❎  언어 리로드 중..\n❎  설정파일 리로드중..\n❎  DB 모델파일 리로드중..\n❎  유틸 리로드 중..\n❎  이벤트 리로드 중..`)
      const Locale = await this.client.utils.localePicker.init()
      await m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n✅  언어 리로드 완료! (${Locale.keyArray().length} 개)\n❎  설정파일 리로드중..\n❎  DB 모델파일 리로드중..\n❎  유틸 리로드 중..\n❎  이벤트 리로드 중..`)
      delete require.cache[require.resolve('../../settings.js')]
      this.client._options = require('../../settings.js')
      await m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n✅  언어 리로드 완료! (${Locale.keyArray().length} 개)\n✅  설정파일 리로드 완료!..\n❎  DB 모델파일 리로드중..\n❎  유틸 리로드 중..\n❎  이벤트 리로드 중..`)
      delete require.cache[require.resolve('../../models')]
      this.client.database.Models = require('../../models')
      await m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n✅  언어 리로드 완료! (${Locale.keyArray().length} 개)\n✅  설정파일 리로드 완료!\n✅  DB 모델파일 리로드 완료!\n❎  유틸 리로드 중..\n❎  이벤트 리로드 중..`)
      delete require.cache[require.resolve('../../modules/utils')]
      this.client.utils = require('../../modules/utils')
      delete require.cache[require.resolve('../../locales/localePicker')]
      delete require.cache[require.resolve('../../modules')]
      const LocalePicker = require('../../locales/localePicker')
      const { PermissionChecker } = require('../../modules')
      this.client.utils.localePicker = new LocalePicker(this.client)
      this.client.utils.permissionChecker = new PermissionChecker(this.client)
      this.client.utils.localePicker.init()
      this.client.loggerManager.init()
      await m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n✅  언어 리로드 완료! (${Locale.keyArray().length} 개)\n✅  설정파일 리로드 완료!\n✅  DB 모델파일 리로드 완료!\n✅  유틸 리로드 완료!\n❎  이벤트 리로드 중..`)
      this.client.registerEvents()
      await m.edit(`✅  명령어 리로드 완료! (${Data.keyArray().length} 개)\n✅  언어 리로드 완료! (${Locale.keyArray().length} 개)\n✅  설정파일 리로드 완료!\n✅  DB 모델파일 리로드 완료!\n✅  유틸 리로드 완료!\n✅  이벤트 리로드 완료!\n✅  모든 구성 요소들이 리로드 되었어요!`)
    })
  }
}

module.exports = Command
