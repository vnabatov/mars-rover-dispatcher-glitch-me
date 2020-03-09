
var express = require('express')
var app = express()
var server = app.listen(process.env.PORT || 3000)
var io = require('socket.io').listen(server)

app.use(express.static('public'))
app.use(express.static('views'))
app.use(express.static('node_modules/p5/lib'))
app.use(express.static('node_modules/p5/lib/addons'))

const staticFolderPath = process.env.staticContentFolder || 'client/public'
app.use('/', express.static(staticFolderPath))

// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {
  const defaultRoomName = 'lobby'

  var currentRoomName

  socket.on('disconnect', function () {
    console.log('Got disconnect!')
  })

  socket.on('echo', function (data) {
    socket.emit('echo', data)
  })

  socket.on('msg:acknowledge', function (data) {
    console.log('msg:acknowledge', data)
  })

  socket.on('msg:rejected', function (data) {
    console.log('msg:rejected', data)
  })

  socket.on('message', function (data) {
    console.log('message', currentRoomName, data)
    socket.broadcast.to(currentRoomName).emit('message', data)
    socket.emit('msg:broadcasted', data)
  })

  socket.join(defaultRoomName, function () {
    currentRoomName = defaultRoomName
    const rooms = Object.keys(socket.rooms).filter(item => item !== socket.id)
    socket.emit('welcome', { currRooms: rooms })
  })

  socket.on('join', ({ roomName }) => {
    socket.leave(currentRoomName, () => {
      console.log('leave', currentRoomName, socket.id)
      socket.emit('leave', { roomName: currentRoomName })
      socket.join(roomName, () => {
        currentRoomName = roomName
        socket.to(roomName).emit('memberJoined', { clientId: socket.id })
        console.log('join', roomName, socket.id)
        socket.emit('join', { roomName })
      })
    })
  })
})
