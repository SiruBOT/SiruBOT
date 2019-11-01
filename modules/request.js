const fetch = require('node-fetch')

module.exports.requestAsync = async (url) => {
  return fetch(url)
}
