// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 5114;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = new Array(1000);
for (var i =0; i < numUsers.length; i++)
  numUsers[i] = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.to(data.keyword).emit('new message', {
      username: socket.username,
      message: data.message
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (send) {
    console.log(send);
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = send.user;
    ++numUsers[parseInt(send.keyword)];
    addedUser = true;

    socket.join(send.keyword).emit('login', {
      numUsers: numUsers[send.keyword]
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.to(send.keyword).emit('user joined', {
      username: socket.username,
      numUsers: numUsers[parseInt(send.keyword)]
    });


  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function (userkeyword) {
    socket.broadcast.to(userkeyword).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function (userkeyword) {
    socket.broadcast.to(userkeyword).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function (userkeyword) {
    if (addedUser) {
      --numUsers[parseInt(userkeyword)];

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers[userkeyword]
      });
    }
  });
});
