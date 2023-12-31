const bcrypt = require('bcryptjs')
const { User, Tutor, Course, sequelize } = require('../models')
const { Op } = require('sequelize')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const { imgurFileHandler } = require('../helpers/file-helpers')
const dayjs = require('dayjs')
const localeZhCn = require('dayjs/locale/zh-cn')
dayjs.locale(localeZhCn)

// 取得學習時數前十名的學生
const getTopLearners = async () => {
  const topLearners = await Course.findAll({
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
          isAdmin: false,
          isTutor: false
        }
      }
    ]
  })

  const learningHours = topLearners.map(learner => ({
    ...learner,
    totalDurationHours: (learner.totalDuration / 60).toString()
  }))

  learningHours.sort((a, b) => b.totalDuration - a.totalDuration)

  let currentRanking = 1
  learningHours[0].ranking = currentRanking

  for (let i = 1; i < learningHours.length; i++) {
    if (learningHours[i].totalDuration === learningHours[i - 1].totalDuration) {
      learningHours[i].ranking = currentRanking
    } else {
      currentRanking++
      learningHours[i].ranking = currentRanking
    }
  }

  return learningHours
}

const userController = {
  signUp: async (req, cb) => {
    try {
      const { name, email, password, passwordCheck } = req.body
      // 檢查必填欄位
      if (!name || !email || !password || !passwordCheck) {
        throw new Error('所有欄位皆為必填')
      }
      // 檢查密碼
      if (password !== passwordCheck) {
        throw new Error('密碼不相符，請再次確認密碼')
      }
      // 檢查 Email
      if (!email.includes('@')) {
        throw new Error('Email 格式錯誤，應包含「@」符號')
      }
      // 檢查重複 Email
      const existingUser = await User.findOne({
        where: { email }
      })
      if (existingUser) {
        throw new Error('此 Email 已被註冊')
      }
      // 密碼雜湊
      const hash = await bcrypt.hash(password, 10)
      // 創建新用戶
      await User.create({
        name,
        email,
        password: hash,
        isAdmin: 0,
        isTutor: 0
      })
      return cb(null)
    } catch (err) {
      cb(err)
    }
  },
  getTutors: async (req, cb) => {
    try {
      const DEFAULT_LIMIT = 6
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || DEFAULT_LIMIT
      const offset = getOffset(limit, page)

      const tutors = await Tutor.findAndCountAll({
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

      for (const tutor of tutors.rows) {
        const courses = await Course.findAll({
          where: { tutorId: tutor.id },
          raw: true
        })

        const ratings = courses.map(courseData => courseData.rating).filter(rating => rating > 0)
        let avgRating = 0

        if (ratings.length > 0) {
          const totalRating = ratings.reduce((a, b) => a + b, 0)
          avgRating = (totalRating / ratings.length).toFixed(1)
        }

        tutor.avgRating = avgRating
      }

      const topLearners = await getTopLearners()

      cb(null, {
        tutors: tutors.rows,
        topLearners,
        pagination: getPagination(limit, page, tutors.count)
      })
    } catch (err) {
      cb(err)
    }
  },
  getTutor: async (req, cb) => {
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
      const ratedCourses = courses.filter(courseData => courseData.rating > 0).slice(-5)

      // 未來兩週可預約的時間
      let teachingTime = tutor.teachingTime ? JSON.parse(tutor.teachingTime) : null
      if (!teachingTime) {
        return cb(null, {
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
        .map(courseData => dayjs(courseData.time).format('YYYY-MM-DD(dd) HH:mm'))

      // 開放預約的時間
      const availableTimes = []
      const duration = Number(tutor.duration)
      const today = dayjs().day()
      const availableBookDays = 14
      for (let day = 0; day < availableBookDays; day++) {
        const courseTime = {
          start: 18,
          end: 21
        }
        // 獲取星期幾（0: 星期日, 1: 星期一, 2：星期二 ...）
        const weekday = (today + day) % 7
        if (teachingTime.includes(weekday)) {
          // 生成時間
          for (let i = courseTime.start; i < courseTime.end; i++) {
            const startFormattedTime = dayjs()
              .add(day, 'day')
              .hour(i)
              .minute(0)
              .format('YYYY-MM-DD(dd) HH:mm')

            if (!bookedCourses.includes(startFormattedTime)) {
              // 當時間符合 teaching_time 且未被預約時才將課程加入
              if (duration === 30) {
                const endFormattedTime = dayjs()
                  .add(day, 'day')
                  .hour(i)
                  .minute(30)
                  .format('YYYY-MM-DD(dd) HH:mm')

                availableTimes.push({
                  formattedTime: `${startFormattedTime} ~ ${endFormattedTime}`
                })

                const nextStartFormattedTime = dayjs()
                  .add(day, 'day')
                  .hour(i)
                  .minute(30)
                  .format('YYYY-MM-DD(dd) HH:mm')

                const nextEndFormattedTime = dayjs()
                  .add(day, 'day')
                  .hour(i + 1)
                  .minute(0)
                  .format('YYYY-MM-DD(dd) HH:mm')

                availableTimes.push({
                  formattedTime: `${nextStartFormattedTime} ~ ${nextEndFormattedTime}`
                })
              }
              if (duration === 60) {
                availableTimes.push({
                  formattedTime: `${startFormattedTime} ~ ${dayjs()
                    .add(day, 'day')
                    .hour(i + 1)
                    .minute(0)
                    .format('YYYY-MM-DD(dd) HH:mm')}`
                })
              }
            }
          }
        }
      }

      // 去除被預約的課程，取得可預約的課程
      const unbookedCourses = Array.isArray(bookedCourses)
        ? availableTimes.filter(availableTime => !bookedCourses.includes(availableTime))
        : availableTimes

      // 老師的平均評價
      let avgRating = 0
      const ratings = courses.map(courseData => courseData.rating).filter(rating => rating > 0)
      if (ratings.length > 0) {
        const totalRating = ratings.reduce((a, b) => a + b, 0)
        avgRating = (totalRating / ratings.length).toFixed(1)
      } else {
        avgRating = null
      }

      return cb(null, {
        tutor,
        ratedCourses,
        availableTimes,
        unbookedCourses,
        avgRating
      })
    } catch (err) {
      cb(err)
    }
  },
  searchTutors: async (req, cb) => {
    try {
      const keyword = req.query.keyword.trim()
      const DEFAULT_LIMIT = 6
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || DEFAULT_LIMIT
      const offset = getOffset(limit, page)

      // 搜尋老師
      const tutors = await Tutor.findAndCountAll({
        raw: true,
        nest: true,
        include: [
          {
            model: User,
            attributes: ['name', 'avatar', 'nation']
          }
        ],
        where: {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('User.name')),
              'LIKE',
              `%${keyword.toLowerCase()}%`
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('User.nation')),
              'LIKE',
              `%${keyword.toLowerCase()}%`
            )
          ]
        },
        limit,
        offset
      })

      if (tutors.rows.length === 0) {
        throw new Error(`沒有符合關鍵字「${keyword}」的老師`)
      }

      for (const tutor of tutors.rows) {
        const courses = await Course.findAll({
          where: { tutorId: tutor.id },
          raw: true
        })

        const ratings = courses.map(courseData => courseData.rating).filter(rating => rating > 0)
        let avgRating = 0

        if (ratings.length > 0) {
          const totalRating = ratings.reduce((a, b) => a + b, 0)
          avgRating = (totalRating / ratings.length).toFixed(1)
        }

        tutor.avgRating = avgRating
      }

      const searchedTutors = tutors.rows.map(tutor => ({
        ...tutor,
        tutorIntroduction: tutor.tutorIntroduction
      }))

      const topLearners = await getTopLearners()

      return cb(null, {
        tutors: searchedTutors,
        keyword,
        topLearners,
        pagination: getPagination(limit, page, searchedTutors.length)
      })
    } catch (err) {
      cb(err)
    }
  },
  getProfile: async (req, cb) => {
    const userId = req.user.id
    const targetUserId = Number(req.params.id)

    if (userId !== targetUserId) {
      const errorResponse = {
        error: '無法查看其他使用者頁面',
        redirect: '/'
      }
      return cb(errorResponse)
    }

    if (req.user.isAdmin) {
      const errorResponse = {
        error: '管理員無個人頁面',
        redirect: '/'
      }
      return cb(errorResponse)
    }

    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        raw: true
      })
      if (!user) throw new Error('無該名使用者')

      const courses = await Course.findAll({
        raw: true,
        nest: true,
        where: { userId },
        order: [['time', 'ASC']],
        include: [{
          model: Tutor,
          attributes: ['id', 'userId', 'duration', 'teachingLink'],
          include: [{
            model: User,
            attributes: ['name', 'avatar']
          }]
        }]
      })

      // 格式化時間
      function formatCourseTime (courses) {
        return courses.map(courseItem => {
          const startTime = dayjs(courseItem.time)
          const endTime = startTime.add(courseItem.Tutor.duration, 'minutes')
          return {
            ...courseItem,
            time: `${startTime.format('YYYY-MM-DD(dd) HH:mm')} ~ ${endTime.format('YYYY-MM-DD(dd) HH:mm')}`
          }
        })
      }

      // 過去課程
      const pastCourses = formatCourseTime(
        courses.filter(courseItem => new Date(courseItem.time) < new Date())
      ).reverse()

      // 未來課程
      const futureCourses = formatCourseTime(
        courses.filter(courseItem => new Date(courseItem.time) >= new Date())
      )

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
      const totalDurationHours = (totalDurationMinutes / 60).toString()

      return cb(null, {
        user,
        pastCourses,
        futureCourses,
        studentRanking: studentRanking + 1,
        totalDuration: totalDurationHours
      })
    } catch (err) {
      cb(err)
    }
  },
  editProfile: async (req, cb) => {
    try {
      const userId = req.user.id
      const user = await User.findByPk(userId, { raw: true })

      if (!user) throw new Error('無該名使用者')

      return cb(null)
    } catch (err) {
      cb(err)
    }
  },
  putProfile: async (req, cb) => {
    const { name, nation, introduction } = req.body
    const { file } = req
    const requiredData = {
      name: '名字',
      nation: '國家',
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
        User.findByPk(req.params.id, {
          attributes: {
            exclude: ['password']
          }
        }),
        imgurFileHandler(file)
      ])

      if (!user) throw new Error('無該名使用者')

      await user.update({
        name,
        nation,
        introduction,
        avatar: filePath || user.avatar
      })

      req.flash('success_messages', '成功修改個人資料')
      return cb(null)
    } catch (err) {
      cb(err)
    }
  },
  getApply: async (req, cb) => {
    try {
      const userId = req.user.id
      const user = await User.findByPk(userId,
        {
          attributes: {
            exclude: ['password']
          },
          raw: true
        })
      const tutor = await Tutor.findOne({
        where: { userId },
        raw: true
      })
      if (!user) {
        throw new Error('此用戶不存在')
      }
      if (tutor) {
        throw new Error('您已經是老師')
      }
      return cb(null)
    } catch (err) {
      cb(err)
    }
  },
  postApply: async (req, cb) => {
    const { name, nation, tutorIntroduction, teachingStyle, duration, teachingTime, teachingLink } = req.body
    const userId = req.user.id
    const teachingTimeString = JSON.stringify(teachingTime)
    const { file } = req
    const requiredData = {
      name: '姓名',
      nation: '國家',
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
        imgurFileHandler(file)
      ])

      if (!user) throw new Error('無該名使用者')

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
      return cb(null)
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = userController
