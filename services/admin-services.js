const { User, Tutor } = require('../models')
const { Op } = require('sequelize')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const dayjs = require('dayjs')

const adminController = {
  getUsers: (req, cb) => {
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

        return cb(null, {
          data,
          pagination: getPagination(limit, page, users.count)
        })
      })
      .catch(err => cb(err))
  },
  getStudents: (req, cb) => {
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
        return cb(null, {
          data,
          pagination: getPagination(limit, page, users.count)
        })
      })
      .catch(err => cb(err))
  },
  getTutors: (req, cb) => {
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
        return cb(null, {
          data,
          pagination: getPagination(limit, page, users.count)
        })
      })
      .catch(err => cb(err))
  },
  searchUsers: (req, cb) => {
    const keyword = req.query.keyword.trim()
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
          name: user.name.toLowerCase(),
          nation: user.nation.toLowerCase(),
          createdAt: dayjs(user.createdAt).format('YYYY-MM-DD')
        }))

        const searchedUsers = data.filter(user => {
          return (
            user.name.includes(keyword) || user.nation.includes(keyword)
          )
        })

        if (searchedUsers.length === 0) {
          throw new Error(`沒有符合關鍵字「${keyword}」的用戶`)
        }

        return cb(null, {
          data: searchedUsers,
          pagination: getPagination(limit, page, users.count),
          keyword
        })
      })
      .catch(err => cb(err))
  },
  searchStudents: (req, cb) => {
    const keyword = req.query.keyword.trim()
    const DEFAULT_LIMIT = 10
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    return User.findAndCountAll({
      raw: true,
      nest: true,
      attributes: { exclude: ['password'] },
      where: { isAdmin: 0, isTutor: 0 },
      limit,
      offset
    })
      .then(students => {
        const data = students.rows.map(student => ({
          ...student,
          name: student.name.toLowerCase(),
          nation: student.nation.toLowerCase(),
          createdAt: dayjs(student.createdAt).format('YYYY-MM-DD')
        }))

        const searchedStudents = data.filter(student => {
          return (
            student.name.includes(keyword) || student.nation.includes(keyword)
          )
        })

        if (searchedStudents.length === 0) {
          throw new Error(`沒有符合關鍵字「${keyword}」的學生`)
        }

        return cb(null, {
          data: searchedStudents,
          pagination: getPagination(limit, page, students.count),
          keyword
        })
      })
      .catch(err => cb(err))
  },
  searchTutors: (req, cb) => {
    const keyword = req.query.keyword.trim()
    const DEFAULT_LIMIT = 10
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    return User.findAndCountAll({
      raw: true,
      nest: true,
      attributes: { exclude: ['password'] },
      where: { isAdmin: 0, isTutor: 1 },
      include: [{
        model: Tutor,
        attributes: ['tutorIntroduction', 'teachingStyle']
      }],
      limit,
      offset
    })
      .then(tutors => {
        const data = tutors.rows.map(tutor => ({
          ...tutor,
          name: tutor.name.toLowerCase(),
          nation: tutor.nation.toLowerCase(),
          tutorIntroduction: tutor.Tutor.tutorIntroduction.toLowerCase(),
          teachingStyle: tutor.Tutor.teachingStyle.toLowerCase(),
          createdAt: dayjs(tutor.createdAt).format('YYYY-MM-DD')
        }))

        const searchedTutors = data.filter(tutor => {
          return (
            tutor.name.includes(keyword) || tutor.nation.includes(keyword) || tutor.tutorIntroduction.includes(keyword) || tutor.teachingStyle.includes(keyword)
          )
        })

        if (searchedTutors.length === 0) {
          throw new Error(`沒有符合關鍵字「${keyword}」的老師`)
        }

        return cb(null, {
          data: searchedTutors,
          pagination: getPagination(limit, page, tutors.count),
          keyword
        })
      })
      .catch(err => cb(err))
  }
}

module.exports = adminController
