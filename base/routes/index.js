var express = require('express');
var router = express.Router();
var chatroom_controller = require('../controllers/chatroom')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/joker', function(req, res, next) {
  res.render('joker_input');
});
router.get('/joker_result_type1', function(req, res, next) {
  res.render('joker_result_type1');
});
router.get('/chatroom', chatroom_controller.index);

module.exports = router;
