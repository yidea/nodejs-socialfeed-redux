let passport = require('passport')
let FacebookStrategy = require('passport-facebook').Strategy
let TwitterStrategy = require('passport-twitter').Strategy
let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../models/user')


function usePassportStrategy(OauthStrategy, config, field) {
  config.passReqToCallback = true
  passport.use(new OauthStrategy(config, nodeifyit(authCB, {spread: true})))

  async function authCB(req, token, secret, account) {
    let user = await User.promise.findOne({[field+'.id']: account.id})

    // Are we authorizing?
    if (req.user) {
      // There is a user already linked to this account
      if (user && user.id !== req.user.id) {
        return [false, {message: 'That account is linked to another user already.'}]
      }
      req.user.linkAccount(field, {account, token, secret})
      return req.user
    }

    // Successful linked account login/authorization
    if (user) return user

    // Otherwise, create a new user for the linked account
    return await new User().linkAccount(field, {account, token, secret})
  }
}

function configure(config) {
  // Required for session support / persistent login sessions
  passport.serializeUser(nodeifyit(async (user) => {
    return user.id
  }))

  passport.deserializeUser(nodeifyit(async (id) => {
    return await User.promise.findById(id)
  }))

  usePassportStrategy(FacebookStrategy, {
    clientID: config.facebook.consumerKey,
    clientSecret: config.facebook.consumerSecret,
    callbackURL: config.facebook.callbackUrl,
  }, 'facebook')

  usePassportStrategy(TwitterStrategy, {
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: config.twitter.callbackUrl,
  }, 'twitter')

  passport.use('local-login', new LocalStrategy({
    // By default, local strategy uses username and password
    // Use email instead
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, nodeifyit(async (req, email, password) => {
    if (!email) return [false, {message: 'Invalid email.'}]

    let user = await User.findOne({
      'local.email': email.toLowerCase()
    }).exec()

    if (!user) return [false, {message: 'Invalid email.'}]
    if (!await user.validatePassword(password)) return [false, {message: 'Invalid password.'}]
    return user
  }, {spread: true})))

  passport.use('local-signup', new LocalStrategy({
    // By default, local strategy uses username and password
    // Use email instead
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, nodeifyit(async (req, email, password) => {
    email = (email || '').toLowerCase()

    // Has user signed up already?
    if(req.user && req.user.local.email) {
      return [false, {message: 'You have already signed up.'}]
    }

    // Is the email taken?
    if (await User.findOne({'local.email': email}).exec()) {
// ??? loginMessage instead of signupMessage b/c it's used by /connect/local
      return [false, {message: 'That email is already taken.'}]
    }

    let user = req.user || new User()
    let ret = await user.linkAccount('local', {email, password})
    return ret
  }, {spread: true})))

  return passport
}

module.exports = {passport, configure}
