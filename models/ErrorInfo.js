const mongo = require('mongoose')

const Schema = new mongo.Schema({
  _id: { type: String },
  type: { type: String, default: 'default' },
  name: { type: String },
  stack: { type: String },
  author: { type: String, default: '0' },
  guild: { type: String, default: '0' },
  command: { type: String },
  createdAt: { type: Date, default: new Date() },
  args: { type: Array, default: [] }
}, { collection: 'errorInfo', versionKey: false })

module.exports = mongo.model('errorInfo', Schema)
