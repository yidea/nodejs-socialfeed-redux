#!/usr/bin/env node

let requireDir = require('require-dir')
let configs = requireDir('./config', {recurse: true})
let _ = require('lodash')
let trycatch = require('trycatch')
let App = require('./app/app')

const PORT = process.env.PORT || 8000
const NODE_ENV = process.env.NODE_ENV || 'development'

if (NODE_ENV === 'development') {
  trycatch.configure({'long-stack-traces': true})
}

process.on('uncaughtException', _.compose(onError, process.exit))
process.on('unhandledRejection', onError)
process.on('uncaughtApplicationException', onError)

function onError(err) {
  // Log added enumuerable properties
  console.dir(err)
  // Not all errors have a stack
  if (err && err.stack) console.log(err.stack)
}

let app = new App({
  port: PORT,
  auth: configs.auth[NODE_ENV],
  database: configs.database[NODE_ENV]
})

app.initialize(PORT)
  .then(()=> console.log(`Listening @ http://127.0.0.1:${PORT}`))
  .catch(onError)

