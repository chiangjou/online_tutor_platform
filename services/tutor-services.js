const { User, Tutor, Course } = require('../models')
const { localFileHandler } = require('../helpers/file-helpers')
const dayjs = require('dayjs')

const tutorController = {
  getProfile: async (req, cb) => {
    try {
      const userId = req.user.id
      if (userId !== Number(req.params.id)) throw new Error('無法查看其他使用者頁面')

      const user = await User.findByPk(userId, {
        raw: true,
        nest: true,
        exclude: ['password'],
        include: [{ model: Tutor }]
      })

      if (!user) throw new Error('無該名使用者')

      const courses = await Course.findAll({
        raw: true,
        nest: true,
        where: { tutorId: user.Tutor.id },
        order: [['time', 'ASC']],
        include: [{ model: User }]
      })

      // 平均評價分數
      let avgRating = 0
      const ratings = courses.map(courseItem => courseItem.rating).filter(rating => rating !== null)
      if (ratings.length > 0) {
        const totalRating = ratings.reduce((a, b) => a + b, 0)
        avgRating = (totalRating / ratings.length).toFixed(1)
      }

      // 格式化時間
      function formatCourseTime (courses) {
        return courses.map(courseItem => {
          const duration = user.Tutor?.duration
          const startTime = dayjs(courseItem.time)
          const endTime = duration ? startTime.add(duration, 'minutes') : null
          return {
            ...courseItem,
            time: endTime ? `${startTime.format('YYYY-MM-DD(dd) HH:mm')} ~ ${endTime.format('YYYY-MM-DD(dd) HH:mm')}` : ''
          }
        })
      }

      // 未來課程
      const futureCourses = formatCourseTime(
        courses.filter(courseItem => new Date(courseItem.time) >= new Date())
      )

      // 已被評價的課程
      const ratedCourses = courses
        .filter(courseItem => courseItem.rating !== null)
        .slice(-5)

      return cb(null, {
        user,
        futureCourses,
        ratedCourses,
        avgRating
      })
    } catch (err) {
      cb(err)
    }
  },
  editProfile: (req, cb) => {
    const userId = req.user.id
    if (userId !== Number(req.params.id)) throw new Error('無法查看他人頁面')

    Tutor.findOne({ where: { userId }, raw: true })
      .then(tutor => {
        if (!tutor) throw new Error('無該名老師')
        if (tutor.teachingTime) {
          tutor.teachingTime = JSON.parse(tutor.teachingTime)
          const weekdays = [
            { value: '1', label: '星期一', checked: tutor.teachingTime.includes('1') },
            { value: '2', label: '星期二', checked: tutor.teachingTime.includes('2') },
            { value: '3', label: '星期三', checked: tutor.teachingTime.includes('3') },
            { value: '4', label: '星期四', checked: tutor.teachingTime.includes('4') },
            { value: '5', label: '星期五', checked: tutor.teachingTime.includes('5') },
            { value: '6', label: '星期六', checked: tutor.teachingTime.includes('6') },
            { value: '7', label: '星期日', checked: tutor.teachingTime.includes('7') }
          ]
          return cb(null, {
            tutor,
            weekdays
          })
        }
        return cb(null, {
          tutor
        })
      })
      .catch(err => cb(err))
  },
  putProfile: async (req, cb) => {
    const { name, nation, tutorIntroduction, teachingStyle, duration, teachingLink } = req.body
    const userId = req.user.id
    const teachingTimeString = req.body.teachingTime ? JSON.stringify(req.body.teachingTime) : null
    const { file } = req
    const requiredData = {
      name: '名字',
      nation: '國籍',
      tutorIntroduction: '關於我',
      teachingStyle: '教學風格',
      teachingLink: '課程連結'
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

      if (!user) throw new Error('無該名使用者')

      // 更新 User 資料
      await user.update({
        name,
        nation,
        avatar: filePath || user.avatar
      })

      const tutor = await Tutor.findOne({
        where: { userId },
        attributes: { exclude: ['password'] },
        include: [{
          model: User,
          attributes: ['name', 'nation', 'avatar']
        }]
      })

      if (!tutor) throw new Error('無該名老師')

      // 更新 Tutor 資料
      await tutor.update({
        tutorIntroduction,
        teachingStyle,
        duration,
        teachingTime: teachingTimeString,
        teachingLink
      })

      req.flash('success_messages', '成功更新課程資訊')
      return cb(null)
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = tutorController
