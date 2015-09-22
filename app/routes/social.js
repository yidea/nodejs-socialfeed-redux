let _ = require('lodash')
let then = require('express-then')
let isLoggedIn = require('../middlewares/isLoggedIn')
let socialMiddleware = require('../middlewares/social')
let {renderViewWithError} = require('../lib/routes')
let {getNewPosts} = require('../lib/social')

async function compose (req, res) {
  let status = req.query.text
  if (status.length > 140) {
    return req.flash('error', 'Status is over 140 characters!')
  }

  if (!status) {
    req.flash('error', 'Status is cannot be empty!')
  }

  await req.twitter.promise.post('statuses/update', {status})

  res.redirect('/timeline')
}

async function timeline(req, res) {
  try{
    let posts = await getNewPosts(req, res)
    posts = _.sortBy(_.flatten(posts), 'createdAt')

    let state = JSON.stringify({})
    res.render('timeline.ejs', {posts, state})
  }catch(e){
    console.log('timeline error', e)
    let empty = []
    let state = JSON.stringify({})
    res.render('timeline.ejs', {empty, state})
  }
}

async function like (req, res) {
  let id = req.params.id
  await req.twitter.promise.post('favorites/create', {id})
  res.end()
}

async function unlike (req, res) {
  let id = req.params.id
  await req.twitter.promise.post('favorites/destroy', {id})
  res.end()
}

function reply(req, res) {
  let post = getPostById(req.params.id)
  res.render('reply.ejs', {post})
}

function share(req, res) {
  let post = getPostById(req.params.id)
  res.render('share.ejs', {post})
}

function getPostById(id) {
  return // ...
}

module.exports = (app) => {
  let social = socialMiddleware(app.config)

  // Social
  app.get('/timeline', isLoggedIn, social, then(timeline))
  app.get('/reply/:id', isLoggedIn, reply)
  app.get('/share/:id', isLoggedIn, share)
  app.get('/compose', isLoggedIn, renderViewWithError('compose'))
  app.post('/compose', isLoggedIn, then(compose))
  app.post('/like/:id', isLoggedIn, social, then(like))
  app.post('/unlike/:id', isLoggedIn, social, then(unlike))
}

