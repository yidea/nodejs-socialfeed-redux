let then = require('express-then')
let twitterMiddleware = require('./twitter')
let facebookMiddleware = require('./facebook')

function socialMiddleware(config) {
  let twitter = twitterMiddleware(config)
  let facebook = facebookMiddleware(config)
  return then(async(req, res, next) => {
    await Promise.all([
      twitter.promise(req, res),
      facebook.promise(req, res)
    ])
    next()
  })
}

module.exports = socialMiddleware
