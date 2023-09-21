const bcrypt = require('bcryptjs')
const { User, Tutor } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')

    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')
        return bcrypt.hash(req.body.password, 10)
      })
      .then(hash => User.create({
        name: req.body.name,
        email: req.body.email,
        password: hash
      }))
      .then(() => {
        req.flash('success_messages', '成功註冊帳號！')
        res.redirect('/signin')
      })
      .catch(err => next(err))
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/tutors')
  },
  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },
  getTutors: (req, res, next) => {
    const DEFAULT_LIMIT = 6
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    Tutor.findAndCountAll({
      nest: true,
      raw: true,
      include: [
        {
          model: User,
          attributes: ['name', 'avatar', 'nation']
        }
      ],
      limit,
      offset
    })
      .then(tutors => {
        const data = tutors.rows

        return res.render('tutors', {
          data,
          pagination: getPagination(limit, page, tutors.count)
        })
      })
      .catch(err => next(err))
  },
  getTutor: (req, res, next) => {
    return Tutor.findByPk(req.params.id, {
      nest: true,
      raw: true,
      include: [
        { model: User }
      ]
    })
      .then(tutor => {
        if (!tutor) throw new Error("Tutor didn't exist!")
        res.render('tutor', {
          tutor
        })
      })
      .catch(err => next(err))
  }
}

module.exports = userController
