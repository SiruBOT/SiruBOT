const RESTManager = require('./RESTManager')
const BASE_URL = 'https://api.overwatchleague.com/'
const OWL_COLOR = '#EE9E3A'
class OverwatchLeageRESTManager extends RESTManager {
  static get OWLColor () {
    return OWL_COLOR
  }
}
module.exports = OverwatchLeageRESTManager
