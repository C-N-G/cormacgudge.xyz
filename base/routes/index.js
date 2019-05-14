var express = require('express');
var router = express.Router();
var chatroom_controller = require('../controllers/chatroom')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/joker', function(req, res, next) {
  res.render('joker');
});
router.get('/chatroom', chatroom_controller.index);

module.exports = router;
