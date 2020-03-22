const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,

  // Mod
  welcome: { type: Object, default: { autoRoleEnabled: false, autoRoles: [], textEnabled: false, textContent: null, imageEnabled: false, imageBgURL: null, imageStyle: null, imageTextContent: 'Welcome!', channel: '0' } },
  bye: { type: Object, default: { textEnabled: false, textContent: null, imageEnabled: false, imageBgURL: null, imageStyle: null, imageTextContent: 'See you again!', channel: '0' } },

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
