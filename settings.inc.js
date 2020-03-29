const shardCount = 1
module.exports = {
  bot: {
    token: 'SUPEEEEEEEEER SECRET Token',
    // Prefix: /src/constructors/placeHolderConstructors.js[PREFIX]
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
  }
}
