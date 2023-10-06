const express = require('express')
const router = express.Router()
const adminController = require('../../controllers/admin-controller')
const { authenticatedAdmin } = require('../../middleware/auth')

router.get('/users/search', authenticatedAdmin, adminController.searchUsers)
router.get('/students/search', authenticatedAdmin, adminController.searchStudents)
router.get('/tutors/search', authenticatedAdmin, adminController.searchTutors)

router.get('/users', authenticatedAdmin, adminController.getUsers)
router.get('/students', authenticatedAdmin, adminController.getStudents)
router.get('/tutors', authenticatedAdmin, adminController.getTutors)

router.use('/', (req, res) => res.redirect('/admin/users'))

module.exports = router
