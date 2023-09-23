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
  }
}

module.exports = courseController
