let express = require('express');
let router = express.Router();
let queue = require('../service/queue');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({status:200});
});

router.get('/createQueue', function(req, res, next) {
  queue.createRedisQueue();
  res.json({});
});

router.get('/sendMessage/:events/:messages', function(req, res, next) {
  let messages = parseInt(req.params.messages, 10);
  let events = parseInt(req.params.events, 10);
    messages = messages <=0 ? 1 : messages;
    events = events <=0 ? 1 : events;

  let sum = 0;
  for (let i=0; i<messages; i++) {
    ++sum;
    queue.sendRedisMessage(events);
  }

  res.json({status: 200, messages: sum});
});

module.exports = router;
