const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  name: String,
  authorID: { type: String, default: '0' },
  tracks: { type: Array, default: [] }
}, { collection: 'userPlayList', versionKey: false })

module.exports = mongo.model('userPlayList', Schema)
