module.exports.chooseWeighted = function (items, chances) {
  const sum = chances.reduce((acc, el) => acc + el, 0)
  let acc = 0
  chances = chances.map(el => (acc = el + acc))
  const rand = Math.random() * sum
  return items[chances.filter(el => el <= rand).length]
}

module.exports.randRange = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min
}

module.exports.shuffle = (array) => {
  let currentIndex = array.length
  let temporaryValue
  let randomIndex

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}
