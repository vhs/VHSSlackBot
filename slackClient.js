var config = require("./config"),
    agent = require("superagent-promise"),
    debug = require('debug')('slack'),
    WebSocket = require('ws'),
    EventEmitter = require("events").EventEmitter,
    io = require('socket.io');

var ee = new EventEmitter();

var SLACK_TOKEN = config.slack.token;

module.exports.connect = function(){
    return agent('GET', 'https://slack.com/api/rtm.start')
        .query({
            token: SLACK_TOKEN
        })
        .end()
        .then(function onResult(res) {
            //TODO: Error handling and reconnect logic
            var ws = new WebSocket(res.body.url);
            ws.on('open', function() {
                debug("Slack socket connected");
            });
            ws.on('message', function(message) {
                debug("Incoming message");
                debug(message);
                var payload = JSON.parse(message);
                ee.emit(payload.type, payload);
            });
        }).catch(function(err){
            console.log(err);
        });
};

module.exports.onMessage = function(handler){
    ee.on("message", handler);
};