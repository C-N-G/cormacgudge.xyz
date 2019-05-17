var express = require('express');
var router = express.Router();
var joker_controller = require('../controllers/joker');
var chatroom_controller = require('../controllers/chatroom');
var whiteboard_controller = require('../controllers/whiteboard');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/joker', joker_controller.render);
router.get('/joker_result_type1', function(req, res, next) {
  res.render('joker_result_type1');
});
router.get('/chatroom', chatroom_controller.render);
router.get('/whiteboard', whiteboard_controller.render);

module.exports = router;
