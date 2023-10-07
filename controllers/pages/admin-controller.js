const adminServices = require('../../services/admin-services')

const adminController = {
  getUsers: (req, res, next) => {
    adminServices.getUsers(req, (err, data) => err ? next(err) : res.render('admin/users', data))
  },
  getStudents: (req, res, next) => {
    adminServices.getStudents(req, (err, data) => err ? next(err) : res.render('admin/students', data))
  },
  getTutors: (req, res, next) => {
    adminServices.getTutors(req, (err, data) => err ? next(err) : res.render('admin/tutors', data))
  },
  searchUsers: (req, res, next) => {
    adminServices.searchUsers(req, (err, data) => err ? next(err) : res.render('admin/users', data))
  },
  searchStudents: (req, res, next) => {
    adminServices.searchStudents(req, (err, data) => err ? next(err) : res.render('admin/students', data))
  },
  searchTutors: (req, res, next) => {
    adminServices.searchTutors(req, (err, data) => err ? next(err) : res.render('admin/tutors', data))
  }
}

module.exports = adminController
