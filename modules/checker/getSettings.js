const path = require('path')
const isTesting = require('./isTesting')()

module.exports = function () {
  let settings = null
  if (isTesting) {
    settings = require(path.join(process.cwd(), './settings.inc'))
  } else {
    settings = require(path.join(process.cwd(), './settings'))
  }
  return settings
}
