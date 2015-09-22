let path = require('path')
let Server = require('http').Server
let requireDir = require('require-dir')
let express = require('express')
let morgan = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')
let MongoStore = require('connect-mongo')(session)
let mongoose = require('mongoose')
let flash = require('connect-flash')
let passportMiddleware = require('./middlewares/passport')
let routes = requireDir('./routes', {recurse: true})
let socialMiddleware = require('./middlewares/social')

let io = require('socket.io')
let browserify = require('browserify-middleware')

let {getNewPosts} = require('./lib/social')

require('songbird')

class App {
  constructor(config) {
    let app = this.app = express()
    this.config = app.config = config

    passportMiddleware.configure(config.auth)
    app.passport = passportMiddleware.passport

    // set up our express middleware
    app.use(morgan('dev')) // log every request to the console
    app.use(cookieParser('ilovethenodejs')) // read cookies (needed for auth)
    app.use(bodyParser.json()) // get information from html forms
    app.use(bodyParser.urlencoded({ extended: true }))

    app.set('views', path.join(__dirname, '..', 'views'))
    app.set('view engine', 'ejs') // set up ejs for templating
    
    browserify.settings({transform: ['babelify']})
    app.use('/js/index.js', browserify('./public/js/index.js'))

    this.sessionMiddleware = session({
      secret: 'ilovethenodejs',
      store: new MongoStore({db: 'socialfeedredux'}),
      resave: true,
      saveUninitialized: true
    })
    let initializedPassport = app.passport.initialize()
    let passportSessions = app.passport.session()

    // required for passport
    app.use(this.sessionMiddleware)
    // Setup passport authentication middleware
    app.use(initializedPassport)
    // persistent login sessions
    app.use(passportSessions)
    // Flash messages stored in session
    app.use(flash())
    let social = socialMiddleware(this.config)
    // configure routes
    for (let key in routes) {
      routes[key](app)
    }
    this.server = Server(app)
    this.io = io(this.server)

    this.setupIo();

    this.io.use(this.convertToIoMiddleware(this.sessionMiddleware));
    this.io.use(this.convertToIoMiddleware(initializedPassport));
    this.io.use(this.convertToIoMiddleware(passportSessions));
    this.io.use(this.convertToIoMiddleware(social));    


  }

  convertToIoMiddleware(middleware){
    return (socket, next) => middleware(socket.request, socket.request.res, next)
  }

  async initialize(port) {
    await Promise.all([
      // start server
      this.server.promise.listen(port),
      // connect to the database
      mongoose.connect(this.config.database.url)
    ])
    
    return this
  }

  setupIo() {
    this.io.on('connection', socket => {
      console.log('a user connected')
      socket.on('disconnect', () => {
        console.log('client disconnected')
        clearInterval(intervalId)
      })
  
      let intervalId = setInterval(async ()=> {
        let posts = socket.request.session.cache
        if (posts && posts.length > 0){
          let newPosts = await getNewPosts(socket.request, socket.request.res, posts[0].id)
          if (newPosts){
            console.log('adding new posts to cache', newPosts)
            posts = newPosts.concat(posts)
          }
        }else{
          console.log('initial load of posts')
          posts = await getNewPosts(socket.request, socket.request.res)
        }
        if (posts && posts.length > 0){
          socket.request.session.cache = posts
        }
        socket.emit('posts', {posts})
      }, 20000)
    })
  }
}

module.exports = App
