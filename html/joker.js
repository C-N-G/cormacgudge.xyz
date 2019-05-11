$( document ).ready(function(){
    $('.result-section').hide();
    function add_game_to_list(){
        var input_game = $('.input-text').val();
        if (input_game) {
            $('.game-list > ul').append("<li>"+input_game+"</li>");
            $('.input-text').val("");
        }
    }
    function get_list_values(){
        var games = [];
        $('li').each( function(){
            games.push($(this).text());
        });
        return(games);
    }
    function get_random_result(){
        var games = get_list_values();
        var num = Math.floor(Math.random() * games.length);
        if (games[num] == undefined) {
            games[num] = '';
        }
        if (games[num] == '') {
            games[num] = 'Try adding some games';
        }
        console.log(games[num]);
        return(games[num]);

    }
    function animate_screen_change(element_hide, element_show){
        $(element_hide).animate({
            opacity: '0',
        }, 1000, function(){
            $(this).hide();
            $(this).css('opacity', '100');
            $(element_show).show();
        });
    }
    $('.btn-enter-text').on("click", function(){
        add_game_to_list();
        $(".input-text").focus();
    });
    $(".input-text").on('keyup', function (e) {
        if (e.keyCode == 13) {
            add_game_to_list();
        }
    });
    $('.game-list').on('click', "li", function(){
        $(this).remove();
    });
    $('.btn-result').on('click', function(){
        $('.result-winner').text(get_random_result());
        animate_screen_change('.input-section','.result-section');
    });
    $('.btn-back').on('click', function(){
        animate_screen_change('.result-section','.input-section');
    });
    $('.btn-again').on('click', function(){
        $('.result-winner').text(get_random_result());
    });
});
