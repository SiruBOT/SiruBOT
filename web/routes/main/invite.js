const Router = require('express').Router()

module.exports = (compressed) => {
  const { options, picker, getLocale } = compressed
  Router.get('/', (req, res) => {
    res.render('main/invite', { req: req, options: options, locale: getLocale(req, res, options), picker })
  })

  return Router
}