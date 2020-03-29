const { Collection } = require('discord.js')
const template = require('string-placeholder')
const { placeHolderConstructors, locales } = require('../constructors/')

class LanguagePicker {
  constructor (client) {
    this.client = client
    this.locales = new Collection()
  }

  async init () {
    try {
      this.client.logger.info(`[Locale] Init Locales... (Locales: ${Object.keys(locales).join(', ')})`)
      for (const key of Object.keys(locales)) {
        this.locales.set(key, locales[key])
      }
    } catch (e) {
      this.client.logger.error(e.stack || e.message)
    }
  }

  get (lang, name, placeholder = {}) {
    this.client.logger.debug(`[LanguagePicker:Get] Lang: ${lang}, PATH: ${name}, Placeholders: ${Object.keys(placeholder)}`)
    const language = this.locales.get(lang)[name]
    if (!language) {
      this.client.logger.error(`[LanguagePicker:Get] [Error] Language key is not exists! ${lang}.${name}`)
      return `${lang}.${name}`
    }
    const settings = { before: '%', after: '%' }
    const userPlaceholder = template(language, placeholder, settings)
    const localesKeys = template(userPlaceholder, this.locales.get(lang), settings)
    const result = template(localesKeys, placeHolderConstructors, settings)
    this.client.logger.debug(`[LanguagePicker:Get] Result: ${result}`)

    return result
  }
}
module.exports = LanguagePicker
