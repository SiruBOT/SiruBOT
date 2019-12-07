const Router = require('express').Router()

module.exports = (app) => {
  Router.get('/', (req, res) => {
    res.render('main/index', { req: req })
  })
  return Router
}
