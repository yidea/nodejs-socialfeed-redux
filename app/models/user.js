let mongoose = require('mongoose')
let crypto = require('crypto')
let _ = require('lodash')
const PEPPER = 'S0CIALAUTH3ENTICATOR_HEART_ASYNC'

require('songbird')

let userSchema = mongoose.Schema({
  local: {
    email: String,
    password: String
  },
  facebook: {
    id: String,
    token: String,
    secret: String,
    email: String,
    name: String
  },
  twitter: {
    id: String,
    token: String,
    secret: String,
    username: String,
    name: String
  }
})

userSchema.methods.generateHash = async function(password) {
  let hash = await crypto.promise.pbkdf2(password, PEPPER, 4096, 512, 'sha256')
  return hash.toString('hex')
}

userSchema.methods.validatePassword = async function(password) {
  let hash = await crypto.promise.pbkdf2(password, PEPPER, 4096, 512, 'sha256')
  return hash.toString('hex') === this.local.password
}

// linkAccount('facebook', ...) === linkFacebookAccount(values)
userSchema.methods.linkAccount = function(type, values) {
  return this['link'+_.capitalize(type)+'Account'](values)
}

userSchema.methods.linkLocalAccount = async function({email, password}) {
  this.local.email = email
  this.local.password = await this.generateHash(password)
  await this.save()
  return this
}

userSchema.methods.linkFacebookAccount = async function({account, token, secret}) {
  this.facebook.id = account.id
  this.facebook.token = token
  this.facebook.secret = secret
  this.facebook.name = account.name.givenName + ' ' + account.name.familyName
  this.facebook.email = (account.emails[0].value || '').toLowerCase()
  await this.save()
  return this
}

userSchema.methods.linkTwitterAccount = async function({account, token, secret}) {
  this.twitter.id = account.id
  this.twitter.token = token
  this.twitter.secret = secret
  this.twitter.username = account.username
  this.twitter.name = account.displayName
  await this.save()
  return this
}

userSchema.methods.unlinkAccount = async function(type) {
  this[type] = undefined
  await this.save()
  return this
}

module.exports = mongoose.model('User', userSchema)
