module.exports = {
  bot: {
    token: 'SUPEEEEEEEEER SECRET Token',
    prefix: '->',
    games: ['%users% 명의 유저와 함께하고 있어요!', '봇 리라이트중!', '%guilds% 개의 길드에서 사용 중!', '>>도움 | %ping%', 'https://github.com/cotwo0139/CHINOBOT_BETA.git'],
    gamesInterval: 30000, // 1000ms = 1sec (ms)
    owners: ['260303569591205888']
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
    mongoURL: 'mongodb://mongodbIP:27017/DBNAME?authSource=admin',
    user: 'yourmongodbuser',
    password: 'yourmongodbpassword'
  },
  others: {
    embed_warn: '#FFDADA',
    embed_good: '#DAFFDA',
    embed_general: '#7289DA'
  },
  emojis: {
    no: '❎',
    yes: '✅'
  },
  money: {
    name: '달러',
    emoji: '💸'
  }
}
