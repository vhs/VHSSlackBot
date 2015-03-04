
var socket = io();

$(function() {
    $('form').submit(function() {
        socket.emit("web-message", {
            text: $('#m').val(),
            from: "Web User"
        });
        $('#m').val('');
        return false;
    });

    socket.on('slack-message', function(msg){
        $('#messages').append($('<li>').text(msg.text));
    });
});

