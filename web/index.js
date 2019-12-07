/**
 * Others
 */
const path = require('path')
const routes = require('./routes')
const Logger = require('./modules/logger')
const logger = new Logger()
const morgan = require('morgan')
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
// const pubsubClient = redis.createClient({ host: globalOptions.db.redis.host })

// pubsubClient.on('message', (channel, message) => {
//   console.log(message)
// })

// pubsubClient.subscribe('asdf')

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

/**
 * Page
 */
const Routes = require('./routes')

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './views'))
app.engine('html', require('ejs').renderFile)

app.use('/static', express.static(path.join(__dirname, './static')))

const scopes = ['identify', 'email', 'guilds']

const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next()
  res.send('not logged in :(')
}

app.use(morgan('dev'))

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

app.use('/', Routes.main.index(app))

app.get('/login', passport.authenticate('discord', { scope: scopes }))

app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => { res.redirect('/') })

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

app.get('/info', checkAuth, (req, res) => {
  res.json(req.user)
})

app.use((req, res) => {
  res.status(404).send('not found')
})

/**
 * Https, Http - Server Settings
 */
http.createServer(app).listen(options.host.httpPort, () => {
  logger.info(`[WEB] HTTP Server listening on port ${options.host.httpPort}`)
})
https.createServer(options.cert, app).listen(options.host.httpsPort, () => {
  logger.info(`[WEB] HTTPS Server listening on port ${options.host.httpsPort}`)
})

process.on('uncaughtException', (err) => {
  logger.error(err.stack)
})
