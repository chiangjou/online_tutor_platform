const courseServices = require('../../services/course-services')

const courseController = {
  bookCourse: (req, res, next) => {
    courseServices.bookCourse(req, (err, data) => err ? next(err) : res.redirect(`/tutors/${req.params.id}`))
  },
  deleteCourse: (req, res, next) => {
    courseServices.deleteCourse(req, (err, data) => {
      if (err) return next(err)
      req.session.deleteCourse = data
      return res.redirect(`/users/${req.user.id}`)
    })
  },
  rateCourse: (req, res, next) => {
    courseServices.rateCourse(req, (err, data) => err ? next(err) : res.redirect(`/users/${req.user.id}`))
  }
}

module.exports = courseController
