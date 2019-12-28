const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,

  // Others
  welcomeChannel: { type: String, default: '0' },
  welcomeMessage: { type: String, default: '환영합니다!' },
  locale: { type: String, default: 'ko_kr' },
  filter: { type: Boolean, default: false },
  customFilter: { type: Array, default: [] },
  warningMax: { type: Number, default: 10 },
  announceChannel: { type: String, default: '0' },

  // Audio
  audioMessage: { type: Boolean, default: true },
  audioPlayrelated: { type: Boolean, default: false },
  repeat: { type: Number, default: 0 },
  shuffle: { type: Boolean, default: false },
  dj_role: { type: String, default: '0' },
  volume: { type: Number, default: 40 },
  queue: { type: Array, default: [] },
  nowplaying: { type: Object, default: { track: null } },
  tch: { type: String, default: '0' },
  vch: { type: String, default: '0' }
}, { collection: 'guild', versionKey: false })

module.exports = mongo.model('guild', Schema)
