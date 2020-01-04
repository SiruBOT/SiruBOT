const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  is_supporter: { type: Boolean, default: false },
  money: { type: Number, default: 10000 },
  paydayDate: { type: Date, default: new Date(0) },
  casinoMultiplier: { type: Number, default: 0 },
  profile: { type: String, default: 'default' },
  blacklisted: { type: Boolean, default: false }
}, { collection: 'globalMember', versionKey: false })

module.exports = mongo.model('globalMember', Schema)
