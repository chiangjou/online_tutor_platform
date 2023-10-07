const adminServices = require('../../services/admin-services')

const adminController = {
  getUsers: (req, res, next) => {
    adminServices.getUsers(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  getStudents: (req, res, next) => {
    adminServices.getStudents(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  getTutors: (req, res, next) => {
    adminServices.getTutors(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  searchUsers: (req, res, next) => {
    adminServices.searchUsers(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  searchStudents: (req, res, next) => {
    adminServices.searchStudents(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  searchTutors: (req, res, next) => {
    adminServices.searchTutors(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }
}

module.exports = adminController
