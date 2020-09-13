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

  static _fetchJson (url) {
    return new Promise((resolve, reject) => {
      this._fetch(url).then((req) => {
        req.json().then(resolve).catch(reject)
      }).catch(reject)
    })
  }

  static _fetchText (url) {
    return new Promise((resolve, reject) => {
      this._fetch(url).then((req) => {
        req.text().then(resolve).catch(reject)
      }).catch(reject)
    })
  }

  static _fetch (url) {
    return new Promise((resolve, reject) => {
      fetch(url).then(res => {
        if (!res.ok) throw new FetchFailError('Unexpected server response ' + res.status)
        resolve(res)
      }).catch(reject)
    })
  }
}

module.exports = RESTManager
