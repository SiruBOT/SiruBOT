const path = require('path')

function isTesting () {
  return process.argv[2] === 'test'
}

function getSettings () {
  return isTesting() ? require(path.join(process.cwd(), './settings.inc')) : require(path.join(process.cwd(), './settings'))
}

module.exports = getSettings

module.exports.isTesting = isTesting
