const fetch = require('node-fetch')
const { FetchFailError } = require('../../errors/')
class RESTManager {
  static _replaceParam (string = '', object = {}) {
    let temp = string
    for (const key of Object.keys(object)) {
      temp = temp.replace(':' + key, encodeURI(object[key]))
    }
    return temp
  }

  static async _fetch (url) {
    const res = await fetch(url)
    if (res.status === 200) return res
    throw new FetchFailError('Unexpected server response ' + res.status)
  }
}

module.exports = RESTManager
