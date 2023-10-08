const { Tutor, Course } = require('../models')
const { DateTime } = require('luxon')

const courseController = {
  bookCourse: async (req, cb) => {
    try {
      const { bookDate } = req.body

      const dateRegex = /(\d{4}-\d{2}-\d{2})\([^)]+\)\s(\d{2}:\d{2})\s~\s(\d{4}-\d{2}-\d{2})\([^)]+\)\s(\d{2}:\d{2})/
      const match = bookDate.match(dateRegex)

      if (!bookDate) throw new Error('請選擇日期')

      if (req.user.isTutor || req.user.isAdmin) throw new Error('只有學生可以預約課程')

      const tutorId = req.params.id
      const studentId = req.user.id

      const tutor = await Tutor.findByPk(tutorId)
      if (!tutor) throw new Error('找不到該名老師')

      const getTime = `${match[1]} ${match[2]}:00`
      const startTime = DateTime.fromFormat(getTime, 'yyyy-MM-dd HH:mm:ss', { zone: 'Asia/Taipei' }).toISO()

      const existingCourse = await Course.findOne({
        where: {
          tutorId: tutorId,
          time: startTime
        }
      })

      if (existingCourse) throw new Error('該課程已被預約')

      const newCourse = await Course.create({
        time: startTime,
        tutorId: tutorId,
        userId: studentId,
        isDone: 0
      })
      req.flash('success_messages', '預約成功')
      return cb(null, { course: newCourse })
    } catch (err) {
      req.flash('error_messages', '預約失敗')
      cb(err)
    }
  },
  rateCourse: async (req, cb) => {
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
      return cb(null)
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = courseController
