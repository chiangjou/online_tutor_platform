const tutorServices = require('../../services/tutor-services')

const tutorController = {
  getProfile: (req, res, next) => {
    tutorServices.getProfile(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  editProfile: (req, res, next) => {
    tutorServices.editProfile(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  putProfile: (req, res, next) => {
    tutorServices.putProfile(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }
}

module.exports = tutorController
