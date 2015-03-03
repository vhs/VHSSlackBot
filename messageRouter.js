var slackClient = require('./slackClient');

slackClient.message.received(function(message){
    console.log("new message: " + message.text);
});
