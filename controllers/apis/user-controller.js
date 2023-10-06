const userServices = require('../../services/user-services')
const jwt = require('jsonwebtoken')

const userController = {
  signIn: (req, res, next) => {
    try {
      const userData = req.user.toJSON()
      delete userData.password
      const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' })
      res.json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      })
    } catch (err) {
      next(err)
    }
  },
  signUp: (req, res, next) => {
    userServices.signUp(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  getTutors: (req, res, next) => {
    userServices.getTutors(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  getTutor: (req, res, next) => {
    userServices.getTutor(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  searchTutors: (req, res, next) => {
    userServices.searchTutors(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  getProfile: (req, res, next) => {
    userServices.getProfile(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  editProfile: (req, res, next) => {
    userServices.editProfile(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  putProfile: (req, res, next) => {
    userServices.putProfile(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  getApply: (req, res, next) => {
    userServices.getApply(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  postApply: (req, res, next) => {
    userServices.postApply(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }
}

module.exports = userController
