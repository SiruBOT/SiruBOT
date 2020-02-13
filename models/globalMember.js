const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  is_supporter: { type: Boolean, default: false },
  profile: { type: String, default: 'default' },
  blacklisted: { type: Boolean, default: false }
}, { collection: 'globalMember', versionKey: false })

module.exports = mongo.model('globalMember', Schema)
