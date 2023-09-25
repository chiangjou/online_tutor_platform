const { Tutor, Course } = require('../models')
const dayjs = require('dayjs')

const courseController = {
  bookCourse: (req, res, next) => {
    const tutorId = req.params.id
    const userId = req.user.id
    const { bookTime } = req.body
    if (!dayjs(bookTime).isValid()) throw new Error('請選擇日期')

    return Promise.all([
      Tutor.findByPk(tutorId, { raw: true }),
      Course.findOne({
        where: {
          time: bookTime,
          tutorId
        }
      })
    ])
      .then(([tutor, courses]) => {
        if (tutor.userId === userId) throw new Error('無法預約自己的課程')
        if (courses) throw new Error('這個時段已經被預約')

        return Course.create({
          time: bookTime,
          tutorId,
          userId
        })
      })
      .then(() => {
        req.flash('success_messages', '預約成功')
        return res.redirect(`/tutors/${req.params.id}`)
      })
      .catch(err => next(err))
  },
  rateCourse: (req, res, next) => {
    const id = req.params.id
    const userId = req.user.id
    const { rating, comment } = req.body
    if (!rating) throw new Error('請選擇評分')

    Course.findByPk(id)
      .then(courseData => {
        if (!courseData) throw new Error('沒有此課程')
        if (courseData.userId !== userId) throw new Error('沒有權限評價此課程')
        if (courseData.time > Date.now()) throw new Error('課程結束才可評價')

        return courseData.update({
          rating,
          comment
        })
      })
      .then(() => {
        req.flash('success_messages', '評價成功')
        return res.redirect(`/users/${req.user.id}`)
      })
      .catch(err => next(err))
  }
}

module.exports = courseController
