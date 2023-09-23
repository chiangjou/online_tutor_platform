const { User, Tutor, Course } = require('../models')
const dayjs = require('dayjs')
const { localFileHandler } = require('../helpers/file-helpers')

const tutorController = {
  getProfile: (req, res, next) => {
    const userId = req.user.id
    if (userId !== Number(req.params.id)) throw new Error('無法查看他人頁面')

    User.findByPk(userId, {
      raw: true,
      nest: true,
      exclude: ['password'],
      include: [
        { model: Tutor }
      ]
    })
      .then(user => {
        if (!user) throw new Error('此用戶不存在')
        Course.findAll({
          raw: true,
          nest: true,
          where: { tutorId: user.Tutor.id },
          order: [['time', 'ASC']],
          include: [
            { model: User, attributes: ['name'] }
          ]
        })
          .then(courses => {
            const futureCourses = courses.filter(courseItem => {
              return new Date(courseItem.time) > new Date()
            }).map(courseItem => {
              courseItem.time = dayjs(courseItem.time).format('YYYY-MM-DD HH:mm')
              return courseItem
            })

            const ratedCourses = courses.filter(courseItem => {
              return courseItem.rate !== null
            }).slice(-6)
            return res.render('tutor/profile', { user, futureCourses, ratedCourses })
          })
      })
      .catch(err => next(err))
  },
  editProfile: (req, res, next) => {
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
          return res.render('tutor/edit-profile', { tutor, weekdays })
        }
        return res.render('tutor/edit-profile', { tutor })
      })
      .catch(err => next(err))
  },
  putProfile: (req, res, next) => {
    const { tutorIntroduction, teachingStyle, duration, teachingLink } = req.body
    const userId = req.user.id
    const teachingTimeString = req.body.teachingTime ? JSON.stringify(req.body.teachingTime) : null

    if (userId !== Number(req.params.id)) throw new Error('無法查看他人資料')

    Tutor.findOne({ where: { userId } })
      .then(tutor => {
        if (!tutor) throw new Error('無該名老師')

        return tutor.update({
          tutorIntroduction,
          teachingStyle,
          duration,
          teachingTime: teachingTimeString,
          teachingLink,
        })
      })
      .then(() => {
        req.flash('success_messages', '成功更新課程資訊')
        return res.redirect(`/tutor/${req.params.id}`)
      })
      .catch(err => next(err))
  }
}

module.exports = tutorController
