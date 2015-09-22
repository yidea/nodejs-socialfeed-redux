let _ = require('lodash')
let then = require('express-then')
let isLoggedIn = require('../middlewares/isLoggedIn')
let {renderViewWithError} = require('../lib/routes')

let scopes = {
  facebook: ['email','read_stream'],
  twitter: 'email'
}

async function unlink(req, res, next) {
  let validTypes = Object.keys(scopes).concat(['local'])
  if (!_.contains(validTypes, req.params.type)) return next()

  await req.user.unlinkAccount(req.params.type)
  let stillLoggedIn = _.any(validTypes, type => {
    if (type === 'local') return req.user[type].email
    return req.user[type] && req.user[type].id
  })
  // Stay logged in if they still have linked accounts
  if (stillLoggedIn) {
    return res.redirect('/profile')
  }
  await req.user.remove()
  req.logout()
  res.redirect('/')
}

// Setup routes
module.exports = (app) => {
  let passport = app.passport

  // Authentication
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/timeline',
    failureRedirect: '/login',
    failureFlash: true
  }))
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/timeline',
    failureRedirect: '/signup',
    failureFlash: true
  }))

  let options = {
      successRedirect: '/timeline',
      failureRedirect: '/profile',
      failureFlash: true
  }
  for (let type in scopes) {
    let scope = scopes[type]
    app.get('/auth/'+type, passport.authenticate(type, {scope}))
    app.get(`/auth/${type}/callback`,
      passport.authenticate(type, Object.create(options)))
    app.get(`/connect/${type}`, passport.authorize(type, {scope}))
    app.get(`/connect/${type}/callback`,
      passport.authorize(type, Object.create(options)))
  }

  app.get('/connect/local', renderViewWithError('connect-local'))
  app.post('/connect/local', passport.authenticate('local-signup', {
    successRedirect: '/timeline',
    failureRedirect: '/connect/local',
    failureFlash: true
  }))
  app.get('/unlink/:type', isLoggedIn, then(unlink))
}

