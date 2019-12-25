const prefix = '->'
module.exports = {
  bot: {
    token: 'SUPEEEEEEEEER SECRET Token',
    prefix: prefix,
    games: ['%USERS% 명의 유저와 함께하고 있어요!', '봇 리라이트중!', '%GUILDS% 개의 길드에서 사용 중!', '>>도움 | %PING%ms', 'https://github.com/cotwo0139/CHINOBOT_BETA.git'],
    gamesInterval: 30000, // 1000ms = 1sec (ms)
    owners: [],
    shards: 0
  },
  audio: {
    nodes: [
      { host: '192.168.0.11', port: 2333, password: 'youshallnotpass', reconnectInterval: '1000', reconnect: true },
      { host: '192.168.0.22', port: 2333, password: 'youshallnotpass', reconnectInterval: '1000', reconnect: true }
    ],
    shards: 1
  },
  logger: {
    level: 'debug'
  },
  db: {
    mongo: {
      mongoURL: 'mongodb://mongodbIP:27017/DBNAME?authSource=admin',
      user: 'yourmongodbuser',
      password: 'yourmongodbpassword'
    },
    redis: {
      host: '127.0.0.1',
      port: 6379
    }
  },
  others: {
    embed_warn: '#FFDADA',
    embed_good: '#DAFFDA',
    embed_general: '#7289DA',
    changelog_url: 'https://*****/.github.io/' // https://*****/.github.io/[COMMITID.txt]
  },
  constructors: {
    EMOJI_MUSIC: '🎵',
    EMOJI_NO: '❎',
    EMOJI_YES: '✅',
    EMOJI_FAIL: '⚠',
    EMOJI_PINGPONG: '🏓',
    EMOJI_MONEY: '💸',
    EMOJI_STAR: '⭐',
    EMOJI_BULB: '💡',

    EMOJI_SPEAKER: '🔊',
    EMOJI_AUDIO_NOTHING: '⏹️',
    EMOJI_AUDIO_PAUSED: '⏸️',
    EMOJI_AUDIO_PLAYING: '▶️',
    EMOJI_REPEAT_NOTHING: '➡️',
    EMOJI_REPEAT_ALL: '🔁',
    EMOJI_REPEAT_SINGLE: '🔂',

    EMOJI_SWITCH_ON: '<:emoji_on:649622462765596683>',
    EMOJI_SWITCH_OFF: '<:emoji_off:649622462685773884>',

    BOT_NAME_KR: '치노봇',
    BOT_NAME_EN: 'ChinoBot',

    MONEY_NAME_KR: '치머니',
    MONEY_NAME_EN: 'ChiMoney',

    PREFIX: prefix,

    EMOJI_REGIONS_BRAZIL: '🇧🇷',
    EMOJI_REGIONS_EUROPE: '🇪🇺',
    EMOJI_REGIONS_HONGKONG: '🇭🇰',
    EMOJI_REGIONS_INDIA: '🇮🇳',
    EMOJI_REGIONS_JAPAN: '🇯🇵',
    EMOJI_REGIONS_RUSSIA: '🇷🇺',
    EMOJI_REGIONS_SINGAPORE: '🇸🇬',
    EMOJI_REGIONS_SOUTHAFRICA: '🇿🇦',
    'EMOJI_REGIONS_SOUTH-KOREA': '🇰🇷',
    EMOJI_REGIONS_SYDNEY: '🇦🇺',
    'EMOJI_REGIONS_US-CENTRAL': '🇺🇸',
    'EMOJI_REGIONS_US-EAST': '🇺🇸',
    'EMOJI_REGIONS_US-WEST': '🇺🇸',
    'EMOJI_REGIONS_US-SOUTH': '🇺🇸'
  }
}
