var config = require("./config"),
    agent = require("superagent-promise"),
    debug = require('debug')('slack'),
    WebSocket = require('ws'),
    Promise = require('bluebird'),
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
                if (payload.reply_to){
                    ee.emit("reply", payload);
                }
            });

            ee.on('call', function(params) {
                debug("client call: " + JSON.stringify(params));
                ws.send(JSON.stringify(params));
            });

        }).catch(function(err){
            console.log(err);
        });
};

function sendRTMCommand(payload){
    var id = new Date().getTime();
    payload.id = id;
    return new Promise(function(resolve, reject){
        ee.emit('call', payload);
        var onReply = function(payload){
            if (payload.reply_to == id){
                //TODO: Add timeout if no response.
                ee.removeListener("reply", onReply);
                if (payload.ok){
                    resolve(payload);
                } else {
                    reject(payload);
                }
            }
        };
        ee.on("reply", onReply);
    });
}

module.exports.message = {
    received: function (handler) {
        ee.on("message", handler);
    },
    send: function(message, channel) {
        return sendRTMCommand({ type: "message", channel: channel, text: message });
    }
};

module.exports.ready = function(handler){
    ee.on("hello", handler);
};

module.exports.channels = {
    list: function() {
        return agent('GET', 'https://slack.com/api/channels.list')
            .query({
                token: SLACK_TOKEN
            })
            .end()
            .then(function(res){
                return res.body.channels;
            })
    },
    join: function(channel) {
        debug("Joining channel " + channel);
        return agent('GET', 'https://slack.com/api/channels.join')
            .query({
                token: SLACK_TOKEN,
                name: channel
            })
            .end()
            .then(function(res){
                return res.body;
            });
    }
};

module.exports.command = function(json, callback) {
    return sendRTMCommand(JSON.parse(json));
};
