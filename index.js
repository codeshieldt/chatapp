const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { 
    userJoin, 
    getCurrentUser, 
    userLeave, 
    getRoomUsers 
} = require('./utils/users');

const PORT = process.env.PORT || 3000;
const botName = 'Chatchord Bot'

const server = http.createServer(app);
app.use(express.static(path.join(__dirname, 'public')));
const io = socketio(server);

io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {

        const user = userJoin(socket.id, username, room)
        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Welcome to chatchord'));
    
        socket.broadcast
        .to(user.room)
        .emit(
            'message', 
            formatMessage(botName,`${user.username} has joined the chat`)
        );

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user)
        {
            io.emit('message', formatMessage(botName,`${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
        });
});

server.listen(PORT, () => { console.log(`Listening on ${PORT}`)})