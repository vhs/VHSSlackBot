'use strict';

var io;
var EventEmitter = require("events").EventEmitter;

var ee = new EventEmitter();

module.exports.init = function(server){
    io = require('socket.io')(server);

    io.on('connection', function(socket) {
        console.log('a user connected');
        socket.on('disconnect', function(){
            console.log('user disconnected');
        });

        socket.on('chat message', function(msg){
            console.log('message: ' + msg);

            if (msg.indexOf("/command ") == 0) {
                var json = msg.replace("/command ", "");

                ee.emit("json-command", json);
            }

            ee.emit("received-message", msg);
            io.emit('chat message', msg);
        });

        ee.on("send-message", function(msg) {
            io.emit('chat message', msg);
        });
    });
};

module.exports.io = io;

module.exports.onCommand = function(handler) {
    ee.on("json-command", handler);
};

module.exports.message = {
    send: function(message, callback) {
        ee.emit("send-message", message, callback);
    },
    received: function(handler) {
        ee.on("received-message", handler);
    }
};
