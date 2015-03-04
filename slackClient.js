'use strict';

var config = require("./config").slack,
    agent = require("superagent-promise"),
    debug = require('debug')('slack'),
    WebSocket = require('ws'),
    Promise = require('bluebird'),
    EventEmitter = require("events").EventEmitter,
    io = require('socket.io');

var ee = new EventEmitter();

var SLACK_TOKEN = config.token;
var CHANNEL_ID = config.channel;

var userProfileCache = {};

function setupWebSocket(url){
    //TODO: Error handling and reconnect logic
    var ws = new WebSocket(url);
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
}

//Join needs a channel name, look up the ID here.
function channelInfo(channelName) {
    return agent('GET', 'https://slack.com/api/channels.info')
        .query({
            token: SLACK_TOKEN,
            channel: channelName
        })
        .end()
        .then(function(res){
            if (res.body.ok){
                return res.body.channel;
            }
        });
}

function userInfo(userId) {
    return agent('GET', 'https://slack.com/api/users.info')
        .query({
            token: SLACK_TOKEN,
            user: userId
        })
        .end()
        .then(function(res){
            if (res.body.ok){
                userProfileCache[userId] = res.body.user;
                return res.body.user;
            }
        });
}

function joinChannel(channel){
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

module.exports.connect = function(){
    return agent('GET', 'https://slack.com/api/rtm.start')
        .query({
            token: SLACK_TOKEN
        })
        .end()
        .then(function onResult(res) {
            setupWebSocket(res.body.url);
            return channelInfo(CHANNEL_ID);
        })
        .then(function(channel){
            if (channel){
                return joinChannel(channel.name);
            } else {
                console.warn("No channel with ID " + channel);
            }
        })
        .catch(function(err){
            console.error(err);
            throw err;
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

function populateUsernameInMessage(payload) {
    return new Promise(function(resolve, reject){
        if (payload.username){
            //Nothing do do
            return resolve(payload);
        }
        if (!payload.username && payload.user) {
            if (userProfileCache[payload.user]) {
                payload.username = userProfileCache[payload.user].name;
                return resolve(payload);
            } else {
                return userInfo(payload.user)
                    .then(function(user){
                        userProfileCache[payload.user] = user;
                        payload.username = user.name;
                        resolve(payload);
                    })
                    .catch(function(err){
                        //Resolve anyway
                        payload.username = payload.user;
                        resolve(payload);
                    })
            }
        }
        //Shouldn't get this far unless user and username is missing
        payload.username = payload.user;
        resolve(payload);
    });
}

module.exports.message = {
    received: function (handler) {
        ee.on("message", function(payload){
            populateUsernameInMessage(payload)
                .then(handler);
        });
    },
    send: function(message, channel) {
        return sendRTMCommand({ type: "message", channel: channel, text: message });
    },

    //Sending via the api will let you change the name of the bot
    sendAsUser: function(message, username, channel) {
        channel = channel || config.channel;
        return agent('GET', 'https://slack.com/api/chat.postMessage')
            .query({
                token: SLACK_TOKEN,
                text: message,
                username: username,
                channel: channel
            })
            .end()
            .then(function(res){
                return res.body;
            });
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
            });
    }
};

module.exports.command = function(json, callback) {
    return sendRTMCommand(JSON.parse(json));
};
