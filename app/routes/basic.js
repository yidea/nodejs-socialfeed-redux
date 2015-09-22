let isLoggedIn = require('../middlewares/isLoggedIn')
let {renderView, renderViewWithError} = require('../lib/routes')

function getProfile(req, res) {
  res.render('profile.ejs', {
    user: req.user,
    message: req.flash('error')
  })
}

function logout(req, res) {
  req.logout()
  res.redirect('/')
}

module.exports = (app) => {
  // Basic
  app.get('/', renderView('index'))
  app.get('/profile', isLoggedIn, getProfile)
  app.get('/logout', logout)
  app.get('/login', renderViewWithError('login'))
  app.get('/signup', renderViewWithError('signup'))
}
