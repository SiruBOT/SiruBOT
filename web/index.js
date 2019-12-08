/**
 * Others
 */
const path = require('path')
const globalOptions = require('../settings')
const LocalePicker = require('./locales/picker')
const Logger = require('./modules/logger')
const options = require('./options')
const morgan = require('morgan')
const logger = new Logger()
const picker = new LocalePicker(logger, globalOptions)
picker.init()

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

const cookieParser = require('cookie-parser')
const locale = require('locale')

const defaultLocale = 'en'

/**
 * Page
 */
const Routes = require('./routes')

const scopes = ['identify', 'email', 'guilds']

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './views'))
app.engine('html', require('ejs').renderFile)

app.use(require('serve-favicon')(path.join(__dirname, 'static', 'images', 'favicon.ico'))) // Favicon

app.use('/static', express.static(path.join(__dirname, './static')))

app.use(locale(options.web.supportedLocales, defaultLocale))

app.use(cookieParser())

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

app.use('/', Routes.main.index({ app, passport, options, picker }))

/**
 * 404 Handle
 */
app.use((req, res) => {
  res.status(404).render('errors/404')
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
