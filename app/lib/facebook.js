let _ = require('lodash')
let util = require('util')

async function getFBPosts(req, res) {
  if (!req.facebook) return []

  let access_token = req.facebook.token

  let {error, data} = await new Promise((resolve, reject) =>
    req.facebook.api('/me/home', {access_token}, resolve))

  if (error) {
    let err = new Error(error.message)
    util._extend(err, error)
    throw err
  }
  return _.sortByOrder(data.map(mapFBPost), ['createdAt'], ['desc'])
}

function mapFBPost(post) {
  // In ISO 8601 - '2015-05-20T16:36:29+0000'
  let createdAt = Date.parse(post.created_time.split('+')[0])
  return {
    id: post.id,
    image: post.picture,
    text: post.message,
    name: post.from.name,
    // liked: post.likes.data
    network: {
      icon: 'facebook',
      name: 'Facebook',
      class: 'btn-primary'
    },
    createdAt
  }
}

module.exports = {getFBPosts}
