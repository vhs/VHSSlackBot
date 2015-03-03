var config = require("./config"),
    agent = require("superagent-promise"),
    debug = require('debug')('slack'),
    WebSocket = require('ws'),
    EventEmitter = require("events").EventEmitter,
    io = require('socket.io');

var ee = new EventEmitter();

var SLACK_TOKEN = config.slack.token;

module.exports.connect = function(readyCallback){
    return agent('GET', 'https://slack.com/api/rtm.start')
        .query({
            token: SLACK_TOKEN
        })
        .end()
        .then(function onResult(res) {
            var callRegistry = [];

            //TODO: Error handling and reconnect logic
            var ws = new WebSocket(res.body.url);
            ws.on('open', function() {
                debug("Slack socket connected");
            });
            ws.on('message', function(message) {
                debug("Incoming message");
                debug(message);
                var payload = JSON.parse(message);

                if (payload.type == "hello")
                    readyCallback.call(payload, payload);

                if (payload.reply_to != null && payload.reply_to < callRegistry.length && callRegistry[payload.reply_to] != undefined) {
                    var item = callRegistry[payload.reply_to];

                    delete callRegistry[payload.reply_to];

                    item.callback.call(item.params, payload);
                }

                ee.emit(payload.type, payload);
            });

            ee.on('call', function(params, callback) {
                debug("client call: " + JSON.stringify(params));
                params.id = callRegistry.length;

                callRegistry.push({params: params, callback: callback});

                ws.send(JSON.stringify(params));
            });

        }).catch(function(err){
            console.log(err);
        });
};

module.exports.message = {
    received: function (handler) {
        ee.on("message", handler);
    },
    send: function(message, channel, callback) {
        ee.emit("call", { type: "message", channel: channel, text: message }, callback);
    }
};

module.exports.channels = {
    list: function(callback) {
        ee.emit("call", { type: "channels.list" }, callback); //TODO this is the wrong command for channels, it's possible it only works to send messages. Use https://slack.com/api/channels.list ?
    },
    join: function(channel, callback) {
        ee.emit("call", { type: "channels.join", name: channel }, callback);
    }
};

module.exports.command = function(json, callback) {
    ee.emit("call", JSON.parse(json), callback);
};
