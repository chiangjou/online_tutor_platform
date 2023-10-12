const { getOffset, getPagination } = require('../helpers/pagination-helper')
const { User } = require('../models')
const dayjs = require('dayjs')

const getUserList = async (req, where, include = null, cb) => {
  const DEFAULT_LIMIT = 10
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || DEFAULT_LIMIT
  const offset = getOffset(limit, page)

  try {
    const users = await User.findAndCountAll({
      raw: true,
      nest: true,
      attributes: { exclude: ['password'] },
      where,
      include,
      limit,
      offset
    })
    const data = users.rows.map(user => ({
      ...user,
      createdAt: dayjs(user.createdAt).format('YYYY-MM-DD')
    }))

    cb(null, {
      data,
      pagination: getPagination(limit, page, users.count)
    })
  } catch (err) {
    cb(err)
  }
}

module.exports = {
  getUserList
}
