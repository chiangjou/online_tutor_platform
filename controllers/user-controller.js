const bcrypt = require('bcryptjs')
const { User, Tutor } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const { localFileHandler } = require('../helpers/file-helpers')

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
  },
  getProfile: (req, res, next) => {
    const userId = req.user.id
    if (userId !== Number(req.params.id)) throw new Error('無法查看其他使用者頁面')

    return User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      raw: true
    })
      .then(user => {
        if (!user) throw new Error('此用戶不存在')
        return res.render('user/profile', {
          user
        })
      })
      .catch(err => next(err))
  },
  editProfile: (req, res, next) => {
    const userId = req.user.id
    return User.findByPk(userId, {
      raw: true
    })
      .then(user => {
        if (!user) throw new Error('此用戶不存在')
        return res.render('user/edit-profile', {
          user
        })
      })
      .catch(err => next(err))
  },
  putProfile: (req, res, next) => {
    const { name, nation, introduction } = req.body
    if (!name) throw new Error('Name is required!')
    const { file } = req
    return Promise.all([
      User.findByPk(req.params.id, { attributes: { exclude: ['password'] } }),
      localFileHandler(file)
    ])
      .then(([user, filePath]) => {
        if (!user) throw new Error('此用戶不存在')
        return user.update({
          name,
          nation,
          introduction,
          avatar: filePath || user.avatar
        })
      })
      .then(() => {
        req.flash('success_messages', '成功更新個人資料')
        return res.redirect(`/users/${req.params.id}`)
      })
      .catch(err => next(err))
  },
  getApply: (req, res, next) => {
    const userId = req.user.id
    Promise.all([
      User.findByPk(userId,
        { attributes: { exclude: ['password'] }, raw: true }),
      Tutor.findOne({ where: { userId }, raw: true })
    ])
    .then(([user, tutor]) => {
      if (!user) throw new Error('此用戶不存在')
      if (tutor) throw new Error('您已經是老師')

      return res.render('user/apply-tutor')
    })
    .catch(err => next(err))
  },
  postApply: (req, res, next) => {
    const { tutorIntroduction, teachingStyle, duration, teachingTime, teachingLink } = req.body
    const userId = req.user.id
    const teachingTimeString = JSON.stringify(teachingTime)
    if (!tutorIntroduction || !teachingStyle || !teachingLink) throw new Error('所有欄位皆為必填')

    User.findByPk(userId, { attributes: { exclude: ['password'] } })
    .then(user => {
      if (!user) throw new Error('此用戶不存在')
      return user.update({ isTutor: 1 })
    })
    .then(() => {
      Tutor.create({
        tutorIntroduction,
        teachingStyle,
        duration,
        teachingTime: teachingTimeString,
        teachingLink,
        userId
      })
    })
    .then(() => {
      req.flash('success_messages', '申請成功')
      return res.redirect('/tutors')
    })
    .catch(err => next(err))
  }
}

module.exports = userController
