const adminServices = require('../../services/admin-services')
const { getUserList } = require('../../services/helpers/admin-helpers')
const { Op } = require('sequelize')

const adminController = {
  getUsers: (req, res, next) => {
    const where = { isAdmin: 0 }
    getUserList(req, where, null, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  getStudents: (req, res, next) => {
    const where = {
      [Op.and]: [
        { isAdmin: 0 },
        { isTutor: 0 }
      ]
    }
    getUserList(req, where, null, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  getTutors: (req, res, next) => {
    const where = {
      [Op.and]: [
        { isAdmin: 0 },
        { isTutor: 1 }
      ]
    }
    const include = {
      model: Tutor,
      attributes: ['id', 'tutorIntroduction', 'teachingStyle']
    }
    getUserList(req, where, include, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  searchUsers: (req, res, next) => {
    adminServices.searchUsers(req, (err, data) => (err ? next(err) : res.json({ status: 'success', data })))
  },
  searchStudents: (req, res, next) => {
    adminServices.searchStudents(req, (err, data) => (err ? next(err) : res.json({ status: 'success', data })))
  },
  searchTutors: (req, res, next) => {
    adminServices.searchTutors(req, (err, data) => (err ? next(err) : res.json({ status: 'success', data })))
  }
}

module.exports = adminController
