const { Tutor } = require('../models')
const { Op } = require('sequelize')
const { getUserList, searchUsers } = require('./helpers/admin-helpers')

const adminController = {
  getUsers: (req, cb) => {
    const where = { isAdmin: 0 }
    getUserList(req, where, null, cb)
  },
  getStudents: (req, cb) => {
    const where = {
      [Op.and]: [
        { isAdmin: 0 },
        { isTutor: 0 }
      ]
    }
    getUserList(req, where, null, cb)
  },
  getTutors: (req, cb) => {
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
    getUserList(req, where, include, cb)
  },
  searchUsers: (req, cb) => {
    searchUsers(req, 0, null, cb)
  },
  searchStudents: (req, cb) => {
    searchUsers(req, 0, 0, cb)
  },
  searchTutors: (req, cb) => {
    searchUsers(req, 0, 1, cb)
  }
}

module.exports = adminController
