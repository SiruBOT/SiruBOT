const options = require('./options')
const globalOptions = require('../settings')
/**
 * Sessions
 */
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
// Redis
const redis = require('redis')
const redisClient = redis.createClient({ host: globalOptions.db.redis.host })

redisClient.on('message', (channel, message) => {
  console.log(message)
})

redisClient.subscribe('asdf')

/**
 * Passport
 */
const passport = require('passport')
const Strategy = require('passport-discord').Strategy

/**
 * Web Server
 */
const express = require('express')
const https = require('https')
const http = require('http')
const app = express()

const scopes = ['identify', 'email', 'guilds']

const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next()
  res.send('not logged in :(')
}

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})

passport.use(new Strategy({
  clientID: options.oauth.discord.clientID,
  clientSecret: options.oauth.discord.clientSecret,
  callbackURL: options.oauth.discord.callback,
  scope: scopes
}, (accessToken, refreshToken, profile, done) => {
  process.nextTick(() => {
    return done(null, profile)
  })
}))

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', passport.authenticate('discord', { scope: scopes }), (req, res) => {})
app.get('/callback',
  passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => { res.redirect('/info') } // auth success
)
app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})
app.get('/info', checkAuth, (req, res) => {
  console.log(req.user)
  res.json(req.user)
})

app.use((req, res) => {
  res.status(404).send('not found')
})

/**
 * Https, Http - Server Settings
 */
http.createServer(app).listen(80)
https.createServer(options.cert, app).listen(443)
