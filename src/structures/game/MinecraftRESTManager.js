const fetch = require('node-fetch')
const { FetchFailError } = require('../../errors/')
const MOJANG_BASE = 'https://api.mojang.com'
const USER_PROFILE = MOJANG_BASE + '/users/profiles/minecraft/:username'
const USER_NAME_HISTORY = MOJANG_BASE + '/user/profiles/:uuid/names'
const VISAGE_BASE = 'https://visage.surgeplay.com'
const PROFILE_FACE = VISAGE_BASE + '/face/:size/:uuid.png'
const PROFILE_FRONT = VISAGE_BASE + '/front/:size/:uuid.png'
const PROFILE_FRONT_FULL = VISAGE_BASE + '/frontfull/:size/:uuid.png'
const PROFILE_HEAD = VISAGE_BASE + '/head/:size/:uuid.png'
const PROFILE_BUST = VISAGE_BASE + '/bust/:size/:uuid.png'
const PROFILE_FULL = VISAGE_BASE + '/full/:size/:uuid.png'
const PROFILE_SKIN = VISAGE_BASE + '/skin/:size/:uuid.png'
class MinecraftRESTManager {
  /**
   * @typedef {{ id: String, name: String }} BasicProfile Basic minecraft user profile (uuid, name)
   * @typedef {String} MinecraftUserName 3~16 length minecraft username
   */
  /**
   * @description get basic user info by username
   * @param {MinecraftUserName} username
   * @returns {Promise<BasicProfile>} Promise<BasicProfile>
   */
  static async getProfile (username) {
    const profile = await (await this._fetch(this._replaceParam(USER_PROFILE, { username }))).json()
    return profile
  }

  /**
   * @typedef {{ name: String, ?changedAt: number }} NameHistory Basic minecraft user profile (uuid, name)
   */
  /**
   * @description get name history of provided BasicProfile
   * @param {BasicProfile} profile basic profile
   * @return {Array<NameHistory>} Array of name histories
   */
  static async getNameHistory ({ id }) {
    const nameHistory = await (await this._fetch(this._replaceParam(USER_NAME_HISTORY, { uuid: id }))).json()
    return nameHistory
  }

  /**
   * @typedef {{ id: String, name: String, nameHistory: Array<NameHistory>, profileImages: ProfileImages }} FullProfile
   */
  /**
   *
   * @param {String} username Username
   * @returns {FullProfile} Full Profile
   */
  static async getFullProfile (username) {
    const basicProfile = await this.getProfile(username)
    const nameHistory = await this.getNameHistory(basicProfile)
    const profileImages = this.getProfileImages(basicProfile)
    return {
      profileImages,
      nameHistory,
      id: basicProfile.id,
      name: basicProfile.name
    }
  }

  /**
   * @typedef {{ face: String, front: String, frontFull: String, head: String, bust: String, full: String, skin: String }} ProfileImages
   */
  /**
   * @param {BasicProfile} profile Basic Profile
   * @param {Number} size Image Size
   * @returns {ProfileImages} Object ProfileImages
   */
  static getProfileImages ({ id: uuid }, size = 512) {
    const options = { size, uuid }
    return {
      face: this._replaceParam(PROFILE_FACE, options),
      front: this._replaceParam(PROFILE_FRONT, options),
      frontFull: this._replaceParam(PROFILE_FRONT_FULL, options),
      head: this._replaceParam(PROFILE_HEAD, options),
      bust: this._replaceParam(PROFILE_BUST, options),
      full: this._replaceParam(PROFILE_FULL, options),
      skin: this._replaceParam(PROFILE_SKIN, options)
    }
  }

  static _replaceParam (string, object) {
    let temp = string
    for (const key of Object.keys(object)) {
      temp = temp.replace(':' + key, encodeURI(object[key]))
    }
    return temp
  }

  static async _fetch (url) {
    const res = await fetch(url)
    if (res.status === 200) return res
    throw new FetchFailError('Unexpected server response ' + res.status)
  }
}

module.exports = MinecraftRESTManager
