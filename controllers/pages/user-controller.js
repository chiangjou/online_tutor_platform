const userServices = require('../../services/user-services')

function redirectWithMessage (req, res, url, message) {
  req.flash('success_messages', message)
  res.redirect(url)
}

const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    userServices.signUp(req, (err, data) => err ? next(err) : redirectWithMessage(req, res, '/signin', '成功註冊帳號'))
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    redirectWithMessage(req, res, '/tutors', '成功登入')
  },
  logout: (req, res) => {
    redirectWithMessage(req, res, '/signin', '成功登出')
    req.logout()
  },
  getTutors: (req, res, next) => {
    userServices.getTutors(req, (err, data) => err ? next(err) : res.render('tutors', data))
  },
  getTutor: (req, res, next) => {
    userServices.getTutor(req, (err, data) => err ? next(err) : res.render('tutor', data))
  },
  searchTutors: (req, res, next) => {
    userServices.searchTutors(req, (err, data) => err ? next(err) : res.render('tutors', data))
  },
  getProfile: (req, res, next) => {
    userServices.getProfile(req, (err, data) => err ? next(err) : res.render('user/profile', data))
  },
  editProfile: (req, res, next) => {
    userServices.editProfile(req, (err, data) => err ? next(err) : res.render('user/edit-profile', data))
  },
  putProfile: (req, res, next) => {
    userServices.putProfile(req, (err, data) => err ? next(err) : res.redirect(`/users/${req.params.id}`))
  },
  getApply: (req, res, next) => {
    userServices.getApply(req, (err, data) => err ? next(err) : res.render('user/apply-tutor', data))
  },
  postApply: (req, res, next) => {
    userServices.postApply(req, (err, data) => err ? next(err) : res.redirect(`/tutor/${req.params.id}`))
  }
}

module.exports = userController
