const Router = require('express').Router()
const scopes = ['identify', 'email', 'guilds']
const Locale = require('locale')

module.exports = (compressed) => {
  const { passport, options, picker } = compressed
  Router.get('/', (req, res) => {
    const locales = new Locale.Locales(req.headers['accept-language'])
    const locale = locales.best(new Locale.Locales(options.web.supportedLocales))
    if (!req.cookies.locale) res.cookie('locale', locale.normalized)
    const localeNormalized = req.cookies.locale ? req.cookies.locale : locale.normalized
    console.log(localeNormalized)
    res.render('main/index', { req: req, options: options, locale: localeNormalized, picker })
  })

  Router.get('/login', passport.authenticate('discord', { scope: scopes }))

  Router.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => { res.redirect('/') })

  Router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  Router.get('/info', checkAuth, (req, res) => {
    res.json(req.user)
  })
  return Router
}

const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next()
  res.send('not logged in :(')
}
