const RESTManager = require('./RESTManager')
const OWL_COLOR = '#EE9E3A'
const BASE_URL = 'https://api.overwatchleague.com/'
const LIVE_MATCH = BASE_URL + '/live-match'
class OverwatchLeageRESTManager extends RESTManager {
  static get OWLColor () {
    return OWL_COLOR
  }

  static getLiveMatch () {
    return this._fetchJson(this._replaceParam(LIVE_MATCH))
  }
}
module.exports = OverwatchLeageRESTManager
