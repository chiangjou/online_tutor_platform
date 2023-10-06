if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const exphbs = require('express-handlebars')
const flash = require('connect-flash')
const session = require('express-session')
const passport = require('./config/passport')
const methodOverride = require('method-override')
const path = require('path')
const handlebarsHelpers = require('./helpers/handlebars-helpers')
const { getUser } = require('./helpers/auth-helpers')
const { pages, apis } = require('./routes')
const app = express()
const port = process.env.PORT

// handlebars
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: handlebarsHelpers
}))
app.set('view engine', 'hbs')

// public
app.use(express.static('public'))

// body-parser
app.use(express.urlencoded({ extended: true }))

// session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

// passport
app.use(passport.initialize())
app.use(passport.session())

// method-override
app.use(methodOverride('_method'))

// flash
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success_messages')
  res.locals.error_messages = req.flash('error_messages')
  res.locals.user = getUser(req)
  next()
})

// path
app.use('/upload', express.static(path.join(__dirname, 'upload')))

app.use('/api', apis)
app.use(pages)

app.listen(port, () => console.log(`App is listening on port http://localhost:${port}`))

module.exports = app
