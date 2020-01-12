const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: String,
  name: String,
  actions: { type: Array, default: [] }
}, { collection: 'customCommand', versionKey: false })

module.exports = mongo.model('customCommand', Schema)
