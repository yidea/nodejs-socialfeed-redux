let _ = require('lodash')

async function getTweets(req, res, lastTweet) {
  if (!req.twitter) return []
  let params = {since_id: lastTweet || 1};
  try{
    let url = 'statuses/home_timeline'
    let [tweets] = await req.twitter.promise.get( url, params)
    return _.sortByOrder(tweets.map(mapTweet), ['createdAt'], ['desc'])
  }catch(e){
    console.log('getTweets error',e, e.message)
  }
}

function mapTweet(tweet) {
  return {
    id: tweet.id_str,
    image: tweet.user.profile_image_url,
    text: tweet.text,
    name: tweet.user.name,
    username: '@'+tweet.user.screen_name,
    liked: tweet.favorited,
    network: {
      icon: 'twitter',
      name: 'Twitter',
      class: 'btn-info'
    },
    createdAt: Date.parse(tweet.created_at)
  }
}

module.exports = {getTweets}
