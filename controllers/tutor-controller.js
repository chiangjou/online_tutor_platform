const { User, Tutor, Course } = require('../models')
const dayjs = require('dayjs')

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
  }
}

module.exports = tutorController
