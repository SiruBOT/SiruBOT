const Router = require('express').Router()
const scopes = ['identify', 'email', 'guilds']

module.exports = (compressed) => {
  const { passport, options, picker, getLocale } = compressed
  Router.get('/:serverId', (req, res) => {
    res.end(req.params.serverId)

    // res.render('', { req: req, options: options, locale: getLocale(req, res, options), picker })
  })

  Router.get('/', (req, res) => {
    res.render('dashboard/serverSelection', { req: req, options: options, locale: getLocale(req, res, options), picker, desc: '' })
  })

  return Router
}
