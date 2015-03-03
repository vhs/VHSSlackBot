'use strict';

var io;

module.exports.init = function(server){
    io = require('socket.io')(server);

    io.on('connection', function(socket) {
        console.log('a user connected');
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });

        socket.on('chat message', function(msg){
            console.log('message: ' + msg);
            io.emit('chat message', msg);
        });
    });
};

module.exports.io = io;
