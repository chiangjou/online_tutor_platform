const courseServices = require('../../services/course-services')

const courseController = {
  bookCourse: (req, res, next) => {
    courseServices.bookCourse(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  deleteCourse: (req, res, next) => {
    courseServices.deleteCourse(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  rateCourse: (req, res, next) => {
    courseServices.rateCourse(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }
}

module.exports = courseController
