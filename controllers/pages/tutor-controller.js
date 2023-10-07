const tutorServices = require('../../services/tutor-services')

const tutorController = {
  getProfile: (req, res, next) => {
    tutorServices.getProfile(req, (err, data) => err ? next(err) : res.render('tutor/profile', data))
  },
  editProfile: (req, res, next) => {
    tutorServices.editProfile(req, (err, data) => err ? next(err) : res.render('tutor/edit-profile', data))
  },
  putProfile: (req, res, next) => {
    tutorServices.putProfile(req, (err, data) => err ? next(err) : res.redirect(`/tutor/${req.params.id}`))
  }
}

module.exports = tutorController
