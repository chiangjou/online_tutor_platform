const bcrypt = require('bcryptjs')
const { User, Tutor, Course, sequelize } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const { localFileHandler } = require('../helpers/file-helpers')
const dayjs = require('dayjs')
const { Op } = require('sequelize')

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
    req.flash('success_messages', '成功登出')
    req.logout()
    res.redirect('/signin')
  },
  getTutors: (req, res, next) => {
    const DEFAULT_LIMIT = 6
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    const tutorsPromise = Tutor.findAndCountAll({
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

    // 學習時數前十名的學生
    const topLearnersPromise = Course.findAll({
      raw: true,
      nest: true,
      where: {
        isDone: true
      },
      attributes: ['userId', [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration']],
      group: ['userId'],
      order: [[sequelize.fn('SUM', sequelize.col('duration')), 'DESC']],
      limit: 10,
      include: [
        {
          model: User,
          attributes: ['name', 'avatar'],
          where: {
            isAdmin: false
          }
        }
      ]
    })
      .then(topLearners => {
        const learingHours = topLearners.map(learner => ({
          ...learner,
          // 將分鐘轉換成小時為單位
          totalDurationHours: (learner.totalDuration / 60).toFixed(1)
        }))

        // 按學習時長降冪排序
        learingHours.sort((a, b) => b.totalDuration - a.totalDuration)

        // 初始化排名
        let currentRanking = 1
        learingHours[0].ranking = currentRanking

        // 處理同時數同名
        for (let i = 1; i < learingHours.length; i++) {
          if (learingHours[i].totalDuration === learingHours[i - 1].totalDuration) {
            // 如果學習時數相同為同一名次
            learingHours[i].ranking = currentRanking
          } else {
            // 否則增加排名
            currentRanking++
            learingHours[i].ranking = currentRanking
          }
        }

        return learingHours
      })

    Promise.all([tutorsPromise, topLearnersPromise])
      .then(([tutors, topLearners]) => {
        return res.render('tutors', {
          tutors: tutors.rows,
          topLearners,
          pagination: getPagination(limit, page, tutors.count)
        })
      })
      .catch(err => next(err))
  },
  getTutor: async (req, res, next) => {
    try {
      const tutorId = req.params.id
      const [tutor, courses] = await Promise.all([
        Tutor.findByPk(tutorId, {
          nest: true,
          raw: true,
          include: [
            {
              model: User,
              attributes: ['name', 'avatar', 'nation']
            }
          ]
        }),
        Course.findAll({
          raw: true,
          nest: true,
          where: { tutorId: tutorId },
          order: [['time', 'DESC']]
        })
      ])

      if (!tutor) throw new Error('找不到該名老師')

      // 已評價的課程
      const ratedCourses = courses.filter(courseData => courseData.rating > 0)

      // 未來兩週可預約的時間
      let teachingTime = tutor.teachingTime ? JSON.parse(tutor.teachingTime) : null
      if (!teachingTime) {
        return res.render('tutor', {
          tutor,
          ratedCourses,
          unbookedCourses: ['目前沒有可預約的課程']
        })
      }
      if (!Array.isArray(teachingTime)) {
        teachingTime = [teachingTime]
      }

      // 將可預約時間轉為數字並排序
      teachingTime = teachingTime.map(day => Number(day)).sort((a, b) => a - b)

      // 已被預約的課程
      const bookedCourses = courses
        .filter(courseData => courseData.time > Date.now())
        .map(courseData => dayjs(courseData.time).format('YYYY-MM-DD HH:mm'))

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
              availableTimes.push(
                dayjs().add(day, 'day').hour(i).minute(0).format('YYYY-MM-DD HH:mm'),
                dayjs().add(day, 'day').hour(i).minute(30).format('YYYY-MM-DD HH:mm')
              )
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
      if (ratings.length > 0) {
        const totalRating = ratings.reduce((a, b) => a + b, 0)
        avgRating = (totalRating / ratings.length).toFixed(1)
      } else {
        avgRating = null
      }

      return res.render('tutor', {
        tutor,
        ratedCourses,
        availableTimes,
        unbookedCourses,
        avgRating
      })
    } catch (err) {
      next(err)
    }
  },
  getProfile: async (req, res, next) => {
    const userId = req.user.id
    if (userId !== Number(req.params.id)) {
      return res.status(403).send('無法查看其他使用者頁面')
    }

    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        raw: true
      })
      if (!user) {
        return res.status(404).send('無該名使用者')
      }

      const courses = await Course.findAll({
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

      // 格式化時間
      function formatCourseTime (courses) {
        return courses.map(courseItem => ({
          ...courseItem,
          time: dayjs(courseItem.time).format('YYYY-MM-DD HH:mm')
        }))
      }
      // 過去課程
      const pastCourses = formatCourseTime(courses.filter(courseItem => new Date(courseItem.time) < new Date())).reverse()
      // 未來課程
      const futureCourses = formatCourseTime(courses.filter(courseItem => new Date(courseItem.time) >= new Date()))

      // 計算學習時數及排名
      const ranking = await Course.findAll({
        raw: true,
        nest: true,
        where: { isDone: true },
        attributes: [
          'userId',
          [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration']
        ],
        group: ['userId'],
        order: [[sequelize.fn('SUM', sequelize.col('duration')), 'DESC']]
      })

      const studentRanking = ranking.findIndex(
        student => student.userId === userId
      )

      const totalDurationMinutes = ranking.find(student => student.userId === userId)?.totalDuration || 0
      const totalDurationHours = (totalDurationMinutes / 60).toFixed(1)

      return res.render('user/profile', {
        user,
        pastCourses,
        futureCourses,
        studentRanking: studentRanking + 1,
        totalDuration: totalDurationHours
      })
    } catch (err) {
      next(err)
    }
  },
  editProfile: async (req, res, next) => {
    try {
      const userId = req.user.id
      const user = await User.findByPk(userId, { raw: true })

      if (!user) {
        return res.status(404).send('無該名使用者')
      }

      return res.render('user/edit-profile', { user })
    } catch (err) {
      next(err)
    }
  },
  putProfile: async (req, res, next) => {
    const { name, nation, introduction } = req.body
    const { file } = req
    const requiredData = {
      name: '名字',
      nation: '國籍',
      introduction: '關於我'
    }
    const missingData = []
    try {
      for (const data in requiredData) {
        if (!req.body[data]) {
          missingData.push(requiredData[data])
        }
      }
      if (missingData.length > 0) {
        throw new Error(`「${missingData.join('、 ')}」為必填`)
      }

      const [user, filePath] = await Promise.all([
        User.findByPk(req.params.id, { attributes: { exclude: ['password'] } }),
        localFileHandler(file)
      ])

      if (!user) {
        return res.status(404).send('無該名使用者')
      }

      await user.update({
        name,
        nation,
        introduction,
        avatar: filePath || user.avatar
      })

      req.flash('success_messages', '成功修改個人資料')
      return res.redirect(`/users/${req.params.id}`)
    } catch (err) {
      next(err)
    }
  },
  getApply: async (req, res, next) => {
    try {
      const userId = req.user.id
      const user = await User.findByPk(userId,
        { attributes: { exclude: ['password'] }, raw: true })
      const tutor = await Tutor.findOne({ where: { userId }, raw: true })
      if (!user) {
        throw new Error('此用戶不存在')
      }
      if (tutor) {
        throw new Error('您已經是老師')
      }
      res.render('user/apply-tutor')
    } catch (err) {
      next(err)
    }
  },
  postApply: async (req, res, next) => {
    const { name, nation, tutorIntroduction, teachingStyle, duration, teachingTime, teachingLink } = req.body
    const userId = req.user.id
    const teachingTimeString = JSON.stringify(teachingTime)
    const { file } = req
    const requiredData = {
      name: '姓名',
      nation: '國籍',
      tutorIntroduction: '關於我',
      teachingStyle: '教學風格',
      teachingLink: '課程視訊連結'
    }
    const missingData = []
    try {
      for (const data in requiredData) {
        if (!req.body[data]) {
          missingData.push(requiredData[data])
        }
      }
      if (missingData.length > 0) {
        throw new Error(`「${missingData.join('、 ')}」為必填`)
      }

      const [user, filePath] = await Promise.all([
        User.findByPk(req.params.id, { attributes: { exclude: ['password'] } }),
        localFileHandler(file)
      ])

      if (!user) {
        return res.status(404).send('無該名使用者')
      }

      // 更新 User 資料
      await user.update({
        name,
        avatar: filePath || user.avatar,
        nation,
        isTutor: 1
      })
      // 建立 Tutor 資料
      await Tutor.create({
        tutorIntroduction,
        teachingStyle,
        duration,
        teachingTime: teachingTimeString,
        teachingLink,
        userId
      })

      req.flash('success_messages', '申請成功')
      return res.redirect(`/tutor/${req.params.id}`)
    } catch (err) {
      return next(err)
    }
  },
  searchTutors: async (req, res, next) => {
    try {
      const keyword = req.query.keyword.trim()
      const DEFAULT_LIMIT = 6
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || DEFAULT_LIMIT
      const offset = getOffset(limit, page)

      // 學習時數前十名的學生
      const topLearners = await Course.findAll({
        raw: true,
        nest: true,
        where: { isDone: true },
        attributes: ['userId', [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration']],
        group: ['userId'],
        order: [[sequelize.fn('SUM', sequelize.col('duration')), 'DESC']],
        limit: 10,
        include: [
          {
            model: User,
            attributes: ['name', 'avatar'],
            where: {
              isAdmin: false
            }
          }
        ]
      })

      // 搜尋老師
      const tutors = await Tutor.findAll({
        raw: true,
        nest: true,
        include: [
          {
            model: User,
            attributes: ['name', 'avatar', 'nation']
          }
        ],
        limit,
        offset
      })

      const tutorsLowerCase = tutors.map(tutor => {
        return {
          ...tutor,
          name: tutor.User.name.toLowerCase(),
          nation: tutor.User.nation.toLowerCase(),
          tutorIntroduction: tutor.tutorIntroduction.toLowerCase(),
          teachingStyle: tutor.teachingStyle.toLowerCase()
        }
      })

      const searchedTutors = tutorsLowerCase.filter(tutor => {
        return (
          tutor.name.includes(keyword) || tutor.nation.includes(keyword) || tutor.tutorIntroduction.includes(keyword) || tutor.teachingStyle.includes(keyword)
        )
      })

      if (searchedTutors.length === 0) {
        throw new Error(`沒有符合關鍵字「${keyword}」的老師`)
      }

      return res.render('tutors', {
        tutors: searchedTutors,
        keyword,
        topLearners,
        pagination: getPagination(limit, page, searchedTutors.length)
      })
    } catch (err) {
      return next(err)
    }
  }
}

module.exports = userController
