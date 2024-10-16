var express = require('express');
var router = express.Router();
const path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    meta_title: 'Frontdoor', 
    meta_desc: 'Educational site used for showcasing projects that Cormac Gudge made',
    meta_css: '/stylesheets/style.css'
  });
});

var joker_controller = require('../controllers/joker');             router.get('/joker', joker_controller.render);

router.get('/joker_result_type1', function(req, res, next) {
  res.render('joker_result_type1');
});

var chatroom_controller = require('../controllers/chatroom');           router.get('/chatroom', chatroom_controller.render);
var whiteboard_controller = require('../controllers/whiteboard');       router.get('/whiteboard', whiteboard_controller.render);
var reflex_controller = require('../controllers/reflex');               router.get('/reflex', reflex_controller.render);
var icarus_controller = require('../controllers/icarus');               router.get('/icarus', icarus_controller.render);
var battleship_controller = require('../controllers/battleship');       router.get('/battleship', battleship_controller.render);
var baristassist_controller = require('../controllers/baristassist');   router.get('/baristassist', baristassist_controller.render);

router.get('/testing/rhw', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../build', 'app.html'));
 })

module.exports = router;
