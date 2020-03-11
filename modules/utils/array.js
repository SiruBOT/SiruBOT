/**
 * @param {Array} arr - Array of chunk
 * @param {Number} chunkSize - Size of chunk
 */
module.exports.chunkArray = (arr, chunkSize) => {
  const array = []
  for (let i = 0, len = arr.length; i < len; i += chunkSize) { array.push(arr.slice(i, i + chunkSize)) }
  return array
}

/**
 * @param {Array} arr - array of shuffle
 * @param {String} property - array of property
 * @param {*} value - value of property
 * @param {Boolean} all - Shuffle All Elements of array?
 * @description Reference from [jagrosh/MusicBot](https://github.com/jagrosh/MusicBot/blob/master/src/main/java/com/jagrosh/jmusicbot/queue/FairQueue.java#L107)
 */
module.exports.shuffle = (arr, property, value = null, all = true) => {
  const propertyArr = []
  for (const index in arr) {
    if (all) propertyArr.push(index)
    else if (arr[index][property] === value) propertyArr.push(index)
  }
  for (const index in propertyArr) {
    const first = propertyArr[index]
    const second = propertyArr[Math.floor(Math.random() * propertyArr.length)]
    const tmp = arr[first]
    arr[first] = arr[second]
    arr[second] = tmp
  }
  return { size: propertyArr.length, result: arr }
}
