const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,

  // Mod
  welcome: {
    autoRoleEnabled: { type: Boolean, default: false },
    autoRoles: { type: Array, default: [] },
    textEnabed: { type: Boolean, default: false },
    textContent: { type: String, default: 'Welcome, {user}' },
    imageEnabled: { type: Boolean, default: false },
    imageBgURL: { type: String, default: null },
    imageStyle: { type: Object, default: null },
    imageTextContent: { type: String, default: 'Welcome!' },
    channel: { type: String, default: '0' }
  },
  bye: {
    textEnabed: { type: Boolean, default: false },
    textContent: { type: String, default: 'See you again, {user}!' },
    imageEnabled: { type: Boolean, default: false },
    imageBgURL: { type: String, default: null },
    imageStyle: { type: Object, default: null },
    imageTextContent: { type: String, default: 'Goodbye :D' },
    channel: { type: String, default: '0' }
  },

  locale: { type: String, default: 'ko_kr' },
  filter: { type: Boolean, default: false },
  customFilter: { type: Object, default: {} },

  warningMax: { type: Number, default: 10 },
  announceChannel: { type: String, default: '0' },

  enabledEvents: { type: Object, default: {} },

  // Audio
  audioMessage: { type: Boolean, default: true },
  audioPlayrelated: { type: Boolean, default: false },
  repeat: { type: Number, default: 0 },
  shuffle: { type: Boolean, default: false },
  dj_role: { type: String, default: '0' },
  volume: { type: Number, default: 40 },
  queue: { type: Array, default: [] },
  nowplaying: { type: Object, default: { track: null } },
  nowplayingPosition: { type: Number, default: 0 },
  tch: { type: String, default: '0' },
  vch: { type: String, default: '0' }
}, { collection: 'guild', versionKey: false })

module.exports = mongo.model('guild', Schema)
