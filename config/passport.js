const passport = require('passport')
const LocalStrategy = require('passport-local')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const bcrypt = require('bcryptjs')
const { User } = require('../models')

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  (req, email, password, cb) => {
    User.findOne({ where: { email } })
      .then(user => {
        if (!user) {
          return cb(null, false, req.flash('error_messages', 'Email 或密碼輸入錯誤'))
        }

        bcrypt.compare(password, user.password).then(res => {
          if (!res) {
            return cb(null, false, req.flash('error_messages', 'Email 或密碼輸入錯誤'))
          }
          return cb(null, user)
        })
      })
  }
))

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK
},
  (accessToken, refreshToken, profile, cb) => {
    const { name, email } = profile._json
    isAdmin = 0
    User.findOne({ where: { email } })
      .then(user => {
        if (user) {
          user.strategy = 'localStrategylocal'
          return cb(null, user)
        }
        const randomPassword = Math.random().toString(36).slice(-8)
        bcrypt
          .genSalt(10)
          .then(salt => bcrypt.hash(randomPassword, salt))
          .then(hash => User.create({
            name,
            email,
            password: hash,
            isAdmin: 0,
            isTutor: 0
          }))
          .then(user => {
            user.strategy = 'localStategylocal'
            cb(null, user)
          })
          .catch(err => cb(err, false))
      })
  }
))

passport.serializeUser((user, cb) => {
  cb(null, user.id)
})
passport.deserializeUser((id, cb) => {
  User.findByPk(id)
    .then(user => {
      user = user.toJSON()
      console.log(user)
      return cb(null, user)
    })
})

module.exports = passport
