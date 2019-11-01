const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,

  // Others
  welcomeChannel: { type: String, default: '0' },
  welcomeMessage: { type: String, default: '환영합니다!' },
  filter: { type: Boolean, default: false },
  customFilter: { type: Array, default: [] },

  // Audio
  repeat: { type: Number, default: 0 },
  shuffle: { type: Boolean, default: false },
  dj_role: { type: String, default: '0' },
  volume: { type: Number, default: 40 },
  queue: { type: Array, default: [] },
  nowplaying: { type: Object, default: { track: null } },
  tch: { type: String, default: '0' },
  vch: { type: String, default: '0' }
}, { collection: 'guild' })

module.exports = mongo.model('guild', Schema)
