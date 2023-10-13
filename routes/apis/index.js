const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')
const upload = require('../../middleware/multer')
const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth')
const { apiErrorHandler } = require('../../middleware/error-handler')

const adminController = require('../../controllers/pages/admin-controller')
const courseController = require('../../controllers/pages/course-controller')
const tutorController = require('../../controllers/pages/tutor-controller')
const userController = require('../../controllers/pages/user-controller')

router.get('/users/search', authenticated, authenticatedAdmin, adminController.searchUsers)
router.get('/students/search', authenticated, authenticatedAdmin, adminController.searchStudents)
router.get('/tutors/search', authenticated, authenticatedAdmin, adminController.searchTutors)

router.get('/users', authenticated, authenticatedAdmin, adminController.getUsers)
router.get('/students', authenticated, authenticatedAdmin, adminController.getStudents)
router.get('/tutors', authenticated, authenticatedAdmin, adminController.getTutors)

router.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.signIn)
router.post('/signup', userController.signUp)

router.get('/tutors/search', authenticated, userController.searchTutors)
router.get('/tutors/:id', authenticated, userController.getTutor)
router.get('/tutors', authenticated, userController.getTutors)

router.get('/users/:id', authenticated, userController.getProfile)
router.get('/users/:id/edit', authenticated, userController.editProfile)
router.put('/users/:id', authenticated, upload.single('avatar'), userController.putProfile)

router.get('/users/:id/apply', authenticated, userController.getApply)
router.post('/users/:id/apply', authenticated, upload.single('avatar'), userController.postApply)

router.get('/tutor/:id', authenticated, tutorController.getProfile)
router.get('/tutor/:id/edit', authenticated, tutorController.editProfile)
router.put('/tutor/:id', authenticated, upload.single('avatar'), tutorController.putProfile)

router.post('/tutors/:id/booking', authenticated, courseController.bookCourse)
router.post('/courses/:id/rating', authenticated, courseController.rateCourse)

router.use('/', apiErrorHandler)

module.exports = router
