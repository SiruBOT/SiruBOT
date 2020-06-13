const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  warningCount: { type: Number, default: 0 },
  warningArray: { type: Array, default: [] },
  afk: {
    reason: { type: String, default: 'NONE' },
    status: { type: Boolean, default: false }
  }
}, { collection: 'guildMember', versionKey: false })

module.exports = mongo.model('guildMember', Schema)
