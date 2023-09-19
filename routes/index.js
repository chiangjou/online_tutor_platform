const express = require('express')
const router = express.Router()

const courseController = require('../controllers/course-controller')
const userController = require('../controllers/user-controller')

const { generalErrorHandler } = require('../middleware/error-handler')

const admin = require('./modules/admin')
router.use('/admin', admin)

router.get('/signup', userController.signUpPage)
router.post('/signup', userController.signUp)

router.get('/tutors', courseController.getTutors)

router.use('/', (req, res) => res.redirect('/tutors'))
router.use('/', generalErrorHandler)

module.exports = router
