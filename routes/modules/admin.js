const express = require('express')
const router = express.Router()
const adminController = require('../../controllers/admin-controller')
const { authenticatedAdmin } = require('../../middleware/auth')

router.get('/users', authenticatedAdmin, adminController.getUsers)

router.use('/', (req, res) => res.redirect('/admin/users'))

module.exports = router
