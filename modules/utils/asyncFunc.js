const glob = require('glob')
const globAsync = (path) => {
  return new Promise((resolve, reject) => {
    glob(path, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  })
}
module.exports.globAsync = globAsync
