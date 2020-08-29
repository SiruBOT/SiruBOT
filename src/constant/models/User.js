const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  is_supporter: { type: Boolean, default: false },
  profile: { type: String, default: 'default' },
  blacklisted: { type: Boolean, default: false },
  subscribedPlaylists: { type: Array, default: [] },
  badges: { type: Array, default: [] },
  cooldownAt: { type: Date, default: 0 }
}, { collection: 'globalUser', versionKey: false })

module.exports = mongo.model('globalUser', Schema)
