const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  name: String,
  items: { type: Array, default: [] }
}, { collection: 'userPlaylist', versionKey: false })

module.exports = mongo.model('userPlaylist', Schema)
