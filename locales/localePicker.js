const { Collection } = require('discord.js')
const locales = require('./index.js')
const template = require('string-placeholder')

class LanguagePicker {
  constructor (client) {
    this.client = client
    this.locales = new Collection()
  }

  async init () {
    try {
      this.client.logger.info(`[Locale] Init Locales... (Locales: ${locales.join(', ')})`)
      for (const key of locales) {
        this.client.logger.debug(`[Locale] [Init] Load Locale ${key}.json`)
        this.locales.set(key, require(`./${key}`))
        delete require.cache[require.resolve(`./${key}`)]
      }
      return this.locales
    } catch (e) {
      this.client.logger.error(e.stack)
    }
  }

  get (lang, name, placeholder = {}) {
    this.client.logger.debug(`[LanguagePicker] [Get] Lang: ${lang}, PATH: ${name}, Placeholders: ${Object.keys(placeholder)}`)
    let language = this.locales.get(lang)[name]
    if (!language) {
      for (const locale of this.locales.array()) {
        if (locale[name]) {
          language = locale[name]
        }
      }
    }
    if (!language) {
      this.client.logger.error(`[LanguagePicker] [Error] Language key is not exists! ${lang}.${name}`)
      return `${lang}.${name}`
    }
    const settings = { before: '%', after: '%' }
    const userPlaceholder = template(language, placeholder, settings)
    const constructors = template(userPlaceholder, this.client._options.constructors, settings)
    const result = template(constructors, this.locales.get(lang), settings)
    this.client.logger.debug(`[LanguagePicker] [Get] Result: ${result}`)

    return result
  }
}
module.exports = LanguagePicker
