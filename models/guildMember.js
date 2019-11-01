const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  warningCount: { type: Number, default: 0 },
  waringArray: { type: Array, default: [] }
}, { collection: 'guildMember' })

module.exports = mongo.model('guildMember', Schema)
