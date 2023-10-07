const courseServices = require('../../services/course-services')

const courseController = {
  bookCourse: (req, res, next) => {
    courseServices.bookCourse(req, (err, data) => err ? next(err) : res.redirect(`/tutors/${req.params.id}`))
  },
  rateCourse: (req, res, next) => {
    courseServices.rateCourse(req, (err, data) => err ? next(err) : res.redirect(`/users/${req.user.id}`))
  }
}

module.exports = courseController
