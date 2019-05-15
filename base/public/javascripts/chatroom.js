$( document ).ready(function() {
    function scroll_top() {
        $('#messages').scrollTop(999*999);
    }
    $('#chat-bar').hide();
    var socket = io('/chatroom');
    $('#chat-bar').submit(function(e){
        e.preventDefault(); // prevents page reloading
        if ($('#m').val()) {
            socket.emit('chat message', $('#m').val());
        }
        $('#m').val('');
        return false;
    });
    $('#nick-bar').submit(function(e){
        e.preventDefault(); // prevents page reloading
        if ($('#nick').val()) {
            socket.emit('nickname', $('#nick').val());
            $('#nick-bar').hide();
            $('#chat-bar').show();
            $('#m').focus();
        }
        $('#nick').val('');
        return false;
    });
    socket.on('chat message', function(msg){
        $('#messages').append($('<li>').text(msg));
        scroll_top();
    });
    socket.on('user connect', function(msg){
        $('#messages').append($('<li>').text(msg + ' has connected'));
        scroll_top();
    });
    socket.on('user disconnect', function(msg){
        socket.emit('client id update');
        $('#messages').append($('<li>').text(msg + ' has disconnected'));
        scroll_top();
    });
    socket.on('client list update', function(msg){
        var data = JSON.parse(msg);
        console.log(data);
        $('#clients').children().remove();
        $('#clients').append('<li><h3>CLIENTS</h3></li>');
        for (var i = 0; i < data.length; i++) {
            $('#clients').append($('<li>').text(data[i]));
        }
    });
});
