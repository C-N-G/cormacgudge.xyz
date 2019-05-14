$( document ).ready(function() {
    $('#chat-bar').hide();
    var socket = io();
    $('#chat-bar').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    $('#nick-bar').submit(function(e){
        e.preventDefault(); // prevents page reloading
        socket.emit('nickname', $('#nick').val());
        $('#nick').val('');
        $('#nick-bar').hide();
        $('#chat-bar').show();
        $('#m').focus();
        return false;
    });
    socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg));
    });
    socket.on('user connect', function(msg){
        $('#messages').append($('<li>').text(msg));
    });
    socket.on('user disconnect', function(msg){
        $('#messages').append($('<li>').text(msg));
    });
});
