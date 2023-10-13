const { getOffset, getPagination } = require('../../helpers/pagination-helper')
const { User, Tutor } = require('../../models')
const dayjs = require('dayjs')

// 取得用戶列表
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

// 搜尋用戶
const searchUsers = async (req, isAdmin, isTutor, cb) => {
  const keyword = req.query.keyword.trim()
  const DEFAULT_LIMIT = 10
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || DEFAULT_LIMIT
  const offset = getOffset(limit, page)

  try {
    const where = {
      isAdmin
    }

    if (isTutor !== null) {
      where.isTutor = isTutor
    }

    const users = await User.findAndCountAll({
      raw: true,
      nest: true,
      attributes: { exclude: ['password'] },
      where,
      include: [{
        model: Tutor,
        attributes: ['tutorIntroduction', 'teachingStyle']
      }],
      limit,
      offset
    })

    const data = users.rows.map(user => ({
      ...user,
      name: user.name.toLowerCase(),
      nation: user.nation.toLowerCase(),
      tutorIntroduction: user.Tutor?.tutorIntroduction?.toLowerCase() || '',
      teachingStyle: user.Tutor?.teachingStyle?.toLowerCase() || '',
      createdAt: dayjs(user.createdAt).format('YYYY-MM-DD')
    }))

    const searchedUsers = data.filter(user => {
      return (
        user.name.includes(keyword) ||
        user.nation.includes(keyword) ||
        (isTutor &&
          (user.tutorIntroduction.includes(keyword) ||
            user.teachingStyle.includes(keyword)))
      )
    })

    if (searchedUsers.length === 0) {
      throw new Error(`沒有符合關鍵字「${keyword}」的用戶`)
    }

    cb(null, {
      data: searchedUsers,
      pagination: getPagination(limit, page, searchedUsers.length),
      keyword
    })
  } catch (err) {
    cb(err)
  }
}

module.exports = {
  getUserList,
  searchUsers
}
