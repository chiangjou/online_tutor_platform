const { User, Tutor } = require('../models')
const { Op } = require('sequelize')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const dayjs = require('dayjs')

const adminController = {
  getUsers: (req, res, next) => {
    const DEFAULT_LIMIT = 10
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    return User.findAndCountAll({
      raw: true,
      nest: true,
      attributes: { exclude: ['password'] },
      where: { isAdmin: 0 },
      limit,
      offset
    })
      .then(users => {
        const data = users.rows.map(user => ({
          ...user,
          createdAt: dayjs(user.createdAt).format('YYYY-MM-DD')
        }))

        return res.render('admin/users', {
          data,
          pagination: getPagination(limit, page, users.count)
        })
      })
      .catch(err => next(err))
  },
  getStudents: (req, res, next) => {
    const DEFAULT_LIMIT = 10
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    return User.findAndCountAll({
      raw: true,
      nest: true,
      attributes: { exclude: ['password'] },
      where: {
        [Op.and]: [
          { isAdmin: 0 },
          { isTutor: 0 }
        ]
      },
      limit,
      offset
    })
      .then(users => {
        const data = users.rows.map(user => ({
          ...user,
          createdAt: dayjs(user.createdAt).format('YYYY-MM-DD')
        }))
        return res.render('admin/students', {
          data,
          pagination: getPagination(limit, page, users.count)
        })
      })
      .catch(err => next(err))
  },
  getTutors: (req, res, next) => {
    const DEFAULT_LIMIT = 10
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    return User.findAndCountAll({
      raw: true,
      nest: true,
      attributes: { exclude: ['password'] },
      where: {
        [Op.and]: [
          { isAdmin: 0 },
          { isTutor: 1 }
        ]
      },
      include: {
        model: Tutor,
        attributes: ['id', 'tutorIntroduction', 'teachingStyle']
      },
      limit,
      offset
    })
      .then(users => {
        const data = users.rows.map(user => ({
          ...user,
          createdAt: dayjs(user.createdAt).format('YYYY-MM-DD')
        }))
        return res.render('admin/tutors', {
          data,
          pagination: getPagination(limit, page, users.count)
        })
      })
      .catch(err => next(err))
  }
}

module.exports = adminController
