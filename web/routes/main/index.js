const Router = require('express').Router()
const scopes = ['identify', 'email', 'guilds']

module.exports = (compressed) => {
  const { passport, options, picker, getLocale } = compressed
  Router.get('/', (req, res) => {
    res.render('main/index', { req: req, options: options, locale: getLocale(req, res, options), picker })
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
