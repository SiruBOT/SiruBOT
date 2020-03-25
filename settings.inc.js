const prefix = '->'
const shardCount = 1
module.exports = {
  bot: {
    token: 'SUPEEEEEEEEER SECRET Token',
    prefix: prefix,
    games: ['%USERS% 명의 유저와 함께하고 있어요!', '봇 리라이트중!', '%GUILDS% 개의 길드에서 사용 중!', '>>도움 | %PING%ms', 'https://github.com/cotwo0139/CHINOBOT_BETA.git'],
    gamesInterval: 30000, // 1000ms = 1sec (ms)
    owners: [],
    shards: shardCount
  },
  webhook: {
    info: {
      id: '123456789012345678',
      token: 'TOKENTOKENTOKENTOKENTOKENTOKEN'
    }
  },
  audio: {
    nodes: [
      { host: '192.168.0.11', port: 2333, password: 'youshallnotpass', reconnectInterval: '1000', reconnect: true, andesite: false }, // If andesite node, true (Filters, karaoke, timescale(etc..))
      { host: '192.168.0.22', port: 2333, password: 'youshallnotpass', reconnectInterval: '1000', reconnect: true, andesite: false } // If andesite node, true
    ],
    shards: shardCount
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
  embed: {
    general: '#7289DA',
    fatal: '#FF4D4D',
    warn: '#FCFFBA',
    good: '#DAFFDA',
    ban: '#FF7575'
  },
  others: {
    changelog_url: 'https://*****/.github.io/' // https://*****/.github.io/[COMMIT ID.txt]
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
    EMOJI_LOCALES: '🌏',
    EMOJI_WARN: '⚠️',
    EMOJI_BIN: '🗑️',
    EMOJI_HASH: '#️⃣',
    EMOJI_PIN: '📌',
    EMOJI_COP: '👮',
    EMOJI_PERSON: '🙍',
    EMOJI_PAPER: '📃',
    EMOJI_HAMMER: '🔨',
    EMOJI_SANDCLOCK: '⏳',
    EMOJI_WAVE: '👋',
    EMOJI_PAINT: '️🖼️',
    EMOJI_LABEL: '🏷️',

    EMOJI_KNOBS: '🎛️',
    EMOJI_SPEAKER: '🔊',
    EMOJI_AUDIO_NONE: '⏹️',
    EMOJI_AUDIO_PAUSED: '⏸️',
    EMOJI_AUDIO_PLAYING: '▶️',
    EMOJI_REPEAT_NONE: '➡️',
    EMOJI_REPEAT_ALL: '🔁',
    EMOJI_REPEAT_SINGLE: '🔂',
    EMOJI_SHUFFLE: '🔀',
    EMOJI_HEADPHONES: '🎧',

    EMOJI_SWITCH_ON: '<:emoji_on:649622462765596683>',
    EMOJI_SWITCH_OFF: '<:emoji_off:649622462685773884>',

    BOT_NAME_KR: '시루봇',
    BOT_NAME_EN: 'SiruBOT',

    MONEY_NAME_KR: '원',
    MONEY_NAME_EN: 'Won',

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
