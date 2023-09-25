const bcrypt = require('bcryptjs')
const { User, Tutor, Course } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const { localFileHandler } = require('../helpers/file-helpers')
const dayjs = require('dayjs')

const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    const { name, email, password, passwordCheck } = req.body
    if (!name || !email || !password || !passwordCheck) throw new Error('所有欄位皆為必填')
    if (password !== passwordCheck) throw new Error('密碼不相符，請再次確認密碼')
    if (!email.includes('@')) throw new Error('Email 格式錯誤，應包含「@」符號')

    return User.findOne({
      where: { email }
    })
      .then(user => {
        if (user) {
          if (user.toJSON().email === email) throw new Error('此 Email 已被註冊')
        }
        return bcrypt.hash(password, 10)
      })
      .then(hash => User.create({
        name,
        email,
        password: hash,
        isAdmin: 0,
        isTutor: 0
      }))
      .then(() => {
        req.flash('success_messages', '成功註冊帳號')
        res.redirect('/signin')
      })
      .catch(err => next(err))
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入')
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
    const tutorId = req.params.id

    return Promise.all([
      Tutor.findByPk(tutorId, {
        nest: true,
        raw: true,
        include: [
          { model: User, attributes: ['name', 'avatar', 'nation'] }
        ]
      }),
      Course.findAll({
        raw: true,
        nest: true,
        where: { tutorId: tutorId },
        order: [['time', 'DESC']]
      })
    ])
      .then(([tutor, courses]) => {
        if (!tutor) throw new Error("找不到該名老師")

        // 已評價的課程
        const ratedCourses = courses.filter(courseData => courseData.rating > 0)

        // 可預約的時間
        let teachingTime = tutor.teachingTime ? JSON.parse(tutor.teachingTime) : null
        if (!teachingTime) {
          return res.render('tutor', { tutor, ratedCourses, unbookedCourses: ['目前沒有可預約的課程'] })
        }
        if (!Array.isArray(teachingTime)) { teachingTime = [teachingTime] }

        // 將可預約時間轉為數字並排序
        teachingTime = teachingTime.map(day => Number(day)).sort((a, b) => a - b)

        // 已被預約的課程
        const bookedCourses = courses.filter(courseData => courseData.time > Date.now()).map(courseData => dayjs(courseData.time).format('YYYY-MM-DD HH:mm'))

        // 開放預約的時間
        const availableTimes = []
        const duration = Number(tutor.duration)
        const today = dayjs().day()
        const availableBookDays = 14
        for (let day = 0; day < availableBookDays; day++) {
          const courseTime = {
            start: 18,
            end: 22
          }
          const weekday = (today + day) % 7
          if (teachingTime.includes(weekday)) {
            for (let i = courseTime.start; i < courseTime.end; i++) {
              if (duration === 30) {
                availableTimes.push(dayjs().add(day, 'day').hour(i).minute(0).format('YYYY-MM-DD HH:mm'))
                availableTimes.push(dayjs().add(day, 'day').hour(i).minute(30).format('YYYY-MM-DD HH:mm'))
              }
              if (duration === 60) {
                availableTimes.push(dayjs().add(day, 'day').hour(i).minute(0).format('YYYY-MM-DD HH:mm'))
              }
            }
          }
        }

        // 去除被預約的課程，取得可預約的課程
        const unbookedCourses = availableTimes.filter(availableTime => !bookedCourses.includes(availableTime))

        // 老師的平均評價
        let avgRating = 0
        const ratings = courses.map(courseData => courseData.rating).filter(rating => rating > 0)
        const totalRating = ratings.reduce((a, b) => a + b, 0)
        avgRating = (totalRating / ratings.length).toFixed(1)

        return res.render('tutor', { tutor, ratedCourses, availableTimes, unbookedCourses, avgRating })
      })
      .catch(err => next(err))
  },
  getProfile: (req, res, next) => {
    const userId = req.user.id
    if (userId !== Number(req.params.id)) throw new Error('無法查看其他使用者頁面')

    return Promise.all([
      User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        raw: true
      }),
      Course.findAll({
        raw: true,
        nest: true,
        where: { userId },
        order: [['time', 'ASC']],
        include: [{
          model: Tutor,
          attributes: ['id', 'userId', 'teachingLink'],
          include: [{
            model: User,
            attributes: ['name', 'avatar']
          }]
        }]
      })
    ])
      .then(([user, courses]) => {
        if (!user) throw new Error('此用戶不存在')

        const pastCourses = courses.filter(courseItem => {
          return new Date(courseItem.time) < new Date()
        }).map(courseItem => {
          courseItem.time = dayjs(courseItem.time).format('YYYY-MM-DD HH:mm')
          return courseItem
        }).reverse()
        const futureCourses = courses.filter(courseItem => {
          return new Date(courseItem.time) >= new Date()
        }).map(courseItem => {
          courseItem.time = dayjs(courseItem.time).format('YYYY-MM-DD HH:mm')
          return courseItem
        })
        return res.render('user/profile', {
          user, pastCourses, futureCourses
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
