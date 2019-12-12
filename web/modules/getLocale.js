const Locale = require('locale')

module.exports = function getLocale (req, res, options) {
  const locales = new Locale.Locales(req.headers['accept-language'])
  const locale = locales.best(new Locale.Locales(options.web.supportedLocales))
  if (!req.cookies.locale) res.cookie('locale', locale.normalized)
  const localeNormalized = req.cookies.locale ? req.cookies.locale : locale.normalized
  console.log(localeNormalized)
  return localeNormalized
}
