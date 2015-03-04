'use strict';

var io;
var slackClient = require("./slackClient");

module.exports.init = function(server){
    io = require('socket.io')(server);

    io.on('connection', function(socket) {
        console.log('a user connected');
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });

        socket.on('web-message', function(msg){
            slackClient.message.sendAsUser(msg.text, msg.from)
                .then(function(msg){
                    socket.emit('web-message-ack', msg);
                })
                .catch(function(err){
                    socket.emit('web-message-err', err);
                });
        });
    });
};

slackClient.message.received(function(payload){
    io.emit("slack-message", payload);
});
