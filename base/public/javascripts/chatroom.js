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
            socket.emit('user is not typing');
        }
        $('#m').val('');
        return false;
    });
    $('#m').on('input', function(){
        if ($('#m').val()){
            socket.emit('user is typing');
        }
        else {
            socket.emit('user is not typing');
        }
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
    socket.on('user is typing', function(msg){
        var data = JSON.parse(msg);
        var id_found = false;
        $('#typing').children().each(function(){
            if ($(this).attr('data-id') == data.nickname_id){
                id_found = true;
            }
        });
        if (id_found == false){
            $('#typing').append('<li data-id="' + data.nickname_id + '">' + data.nickname + ' is typing...</li>');
        }

    });
    socket.on('user is not typing', function(msg){
        var data = JSON.parse(msg);
        $('#typing').children().each(function(){
            if ($(this).attr('data-id') == data.nickname_id){
                $(this).remove();
            }
        });
    });
});
