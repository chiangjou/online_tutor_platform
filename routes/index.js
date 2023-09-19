const express = require('express')
const router = express.Router()

const courseController = require('../controllers/course-controller')

router.get('/tutors', courseController.getTutors)

router.use('/', (req, res) => res.redirect('/tutors'))

module.exports = router
