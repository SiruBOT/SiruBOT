const { Collection } = require('discord.js')
const locales = require('./index.js')
const template = require('string-placeholder')

class LanguagePicker {
  constructor (logger, options) {
    this._options = options
    this.logger = logger
    this.locales = new Collection()
  }

  async init () {
    try {
      this.logger.info(`[Locale] Init Locales... (Locales: ${Object.keys(locales).join(', ')})`)
      for (const key of Object.keys(locales)) {
        this.logger.debug(`[Locale] [Init] Load Locale ${key}.json`)
        this.locales.set(key, require(`./${locales[key]}`))
        delete require.cache[require.resolve(`./${locales[key]}`)]
      }
      return this.locales
    } catch (e) {
      this.logger.error(e.stack)
    }
  }

  get (lang, name, placeholder = {}) {
    this.logger.debug(`[LanguagePicker] [Get] Lang: ${lang}, PATH: ${name}, Placeholders: ${Object.keys(placeholder)}`)
    let language = this.locales.get(lang)[name]
    if (!language) {
      for (const locale of this.locales.array()) {
        if (locale[name]) {
          language = locale[name]
        }
      }
    }
    const settings = { before: '%', after: '%' }
    const userPlaceholder = template(language, placeholder, settings)
    const result = template(userPlaceholder, this._options.constructors, settings)
    this.logger.debug(`[LanguagePicker] [Get] Result: ${result}`)

    return result
  }
}
module.exports = LanguagePicker
