const express = require('express')
const router = express.Router()
const passport = require('../config/passport')

const courseController = require('../controllers/course-controller')
const tutorController = require('../controllers/tutor-controller')
const userController = require('../controllers/user-controller')

const { authenticated } = require('../middleware/auth')
const { generalErrorHandler } = require('../middleware/error-handler')
const upload = require('../middleware/multer')

const auth = require('./modules/auth')
const admin = require('./modules/admin')

router.use('/auth', auth)
router.use('/admin', admin)

router.get('/signup', userController.signUpPage)
router.post('/signup', userController.signUp)
router.get('/signin', userController.signInPage)
router.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.signIn)
router.get('/logout', userController.logout)

router.get('/tutors/search', authenticated, userController.searchTutors)
router.get('/tutors/:id', authenticated, userController.getTutor)
router.get('/tutors', authenticated, userController.getTutors)

router.get('/users/:id', authenticated, userController.getProfile)
router.get('/users/:id/edit', authenticated, userController.editProfile)
router.put('/users/:id', authenticated, upload.single('avatar'), userController.putProfile)

router.get('/users/:id/apply', authenticated, userController.getApply)
router.post('/users/:id/apply', upload.single('avatar'), authenticated, userController.postApply)

router.get('/tutor/:id', authenticated, tutorController.getProfile)
router.get('/tutor/:id/edit', authenticated, tutorController.editProfile)
router.put('/tutor/:id', authenticated, upload.single('avatar'), tutorController.putProfile)


router.post('/tutors/:id/booking', authenticated, courseController.bookCourse)
router.post('/courses/:id/rating', authenticated, courseController.rateCourse)

router.use('/', (req, res) => res.redirect('/tutors'))
router.use('/', generalErrorHandler)

module.exports = router
