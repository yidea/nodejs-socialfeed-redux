let $ = require('jquery')
let io = require('socket.io-client')
let socket = io('http://dev.walmart.com:8000')
let $template = $('#template')

socket.on('connect', ()=>console.log('client connectedxxxxx'))

socket.on('posts', ({posts})=> {
  if (posts && posts.length > 0){
    $('#messages').empty()
  }
  for (let i = 0; i < posts.length; i++) {
    let post = posts[i];
    let $li = $template.clone().show()
    $li.children('i').text(post.username+': ')
    $li.children('span').text(post.text)
    $('#messages').append($li)
  }
})
