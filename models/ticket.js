const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  textChannel: { type: String, default: '0' },
  request: { type: String, default: '0' },
  messages: { type: Array, default: [] }
}, { collection: 'guildTicket', versionKey: false })

module.exports = mongo.model('guildTicket', Schema)
