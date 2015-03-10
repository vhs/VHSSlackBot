
var socket = io();

$(function() {
    ensureUsername();

    $('#username').change(function(asdf) {
        ensureUsername();
    });

    $('form').submit(function() {
        ensureUsername();

        socket.emit("web-message", {
            text: $('#m').val(),
            from: $('#username').val()
        });
        $('#m').val('');
        return false;
    });

    socket.on('slack-message', function(msg){
        var now = new Date();
        $('#messages').append($('<li>').html("<b>" + msg.username + "</b> <span class=\"time\">"+ now.toTimeString() +"</span><br />" + msg.text));
        window.scrollTo(0,document.body.scrollHeight);
    });
});

function ensureUsername() {
    var name = $('#username').val();

    if (!name || /^\s*$/.test(name)) {
        name = localStorage.getItem("username");

        if (!name || /^\s*$/.test(name)) {
            $.ajax({
                url: 'http://api.randomuser.me/',
                dataType: 'json',
                success: function (data) {
                    setUsername(data.results[0].user.username);
                }
            });
        } else {
            setUsername(name);
        }
    } else {
        setUsername(name);
    }
}

function setUsername(username) {
    localStorage.setItem("username", username);
    $('#username').val(username);
}