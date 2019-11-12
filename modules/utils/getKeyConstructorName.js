module.exports = function getKeyConstructorName (key, event) {
  return `"${key}", (${event.constructor.name})`
}
