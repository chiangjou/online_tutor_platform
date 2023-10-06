const express = require('express')
const router = express.Router()
const passport = require('../../config/passport')
const upload = require('../../middleware/multer')
const { authenticated, authenticatedAdmin } = require('../../middleware/api-auth')
const { generalErrorHandler } = require('../../middleware/error-handler')

const adminController = require('../../controllers/pages/admin-controller')
const userController = require('../../controllers/pages/user-controller')

router.get('/users', authenticated, authenticatedAdmin, adminController.getUsers)

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

router.use('/', generalErrorHandler)

module.exports = router
