module.exports = function (e) {
  return `[----- Stack Trace ----- (${e.message})]\n${e.stack}`
}
