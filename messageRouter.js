var slackClient = require('./slackClient');

slackClient.onMessage(function(message){
    console.log("new message: " + message.text);
});
