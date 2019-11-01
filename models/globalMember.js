const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  is_supporter: { type: Boolean, default: false },
  money: { type: Number, default: 10000 },
  getMoneyTimeStamp: { type: Number },
  profile_bg_url: { type: String, default: '0' },
  blacklisted: { type: Boolean, default: false }
}, { collection: 'globalMember' })

module.exports = mongo.model('globalMember', Schema)
