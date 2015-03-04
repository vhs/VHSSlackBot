var slackClient = require('./slackClient');
var debug = require('debug')('slack');
var sio = require('./socketio');
var config = require('./config').slack;

slackClient.connect().then(function(){
    debug("Slack client connected");
    slackClient.channels.list()
        .then(function(channels){
            debug(channels);
        });

    slackClient.channels.join(config.channel)
        .then(function(channel){
            debug("Joined channel");
            debug(channel)
        });
});

slackClient.ready(function(){
    slackClient.message.send("Hello", "C03RR5875")
        .then(function(response){
            debug(response);
        })
        .catch(function(response){
            debug(response);
        });
});

slackClient.message.received(function(message){
    console.log("new message: " + message.text);
});

sio.onCommand(function(json) {
    slackClient.command(json)
        .then(function(result){
            sio.message.send(JSON.stringify(result), function(args) {
                debug(JSON.stringify(args));
            });
        });
});