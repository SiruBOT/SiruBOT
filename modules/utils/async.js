const glob = require('glob')
module.exports.globAsync = (path) => {
  return new Promise((resolve, reject) => {
    glob(path, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
}
