/**
 *
 * @param {Array} arr - Array of chunk
 * @param {Number} chunkSize - Size of chunk
 */
function chunk (arr, chunkSize) {
  const array = []
  for (let i = 0, len = arr.length; i < len; i += chunkSize) { array.push(arr.slice(i, i + chunkSize)) }
  return array
}
module.exports.chunkArray = chunk
