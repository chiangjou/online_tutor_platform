const { Tutor, Course } = require('../models')
const dayjs = require('dayjs')

const courseController = {
  bookCourse: async (req, res, next) => {
    try {
      const tutorId = req.params.id
      const userId = req.user.id
      const { bookDate } = req.body

      if (!dayjs(bookDate).isValid()) throw new Error('請選擇日期')
      if (req.user.isTutor || req.user.isAdmin) throw new Error('只有學生可以預約課程')

      const [tutor, course] = await Promise.all([
        Tutor.findByPk(tutorId, { raw: true }),
        Course.findOne({
          where: {
            time: bookDate,
            tutorId
          }
        })
      ])

      if (tutor.userId === userId) throw new Error('無法預約自己的課程')
      if (course) throw new Error('此時段已經被預約')

      await Course.create({
        time: bookDate,
        tutorId,
        userId
      })
      req.flash('success_messages', '預約成功')
      return res.redirect(`/tutors/${req.params.id}`)
    } catch (err) {
      next(err)
    }
  },
  rateCourse: async (req, res, next) => {
    const courseId = req.params.id
    const currentUserId = req.user.id
    const { rating, comment } = req.body

    try {
      if (!rating) {
        throw new Error('請選擇評分')
      }

      const courseData = await Course.findByPk(courseId)

      if (!courseData) {
        throw new Error('沒有此課程')
      }

      if (courseData.userId !== currentUserId) {
        throw new Error('沒有權限評價此課程')
      }

      if (courseData.time > Date.now()) {
        throw new Error('課程結束才可以評價')
      }

      await courseData.update({ rating, comment })

      req.flash('success_messages', '成功送出')
      res.redirect(`/users/${req.user.id}`)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = courseController
