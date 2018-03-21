let express = require('express');
let router = express.Router();
let queue = require('../service/queue');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({status:200});
});

router.get('/:max', function(req, res, next) {
  let max = parseInt(req.params.max, 10);
  max = max <=0 ? 1 : max;

  let sum = 0;
  for (let i=0; i<max; i++) { sum += i; }

  res.json({status: 200, sum: sum});
});

module.exports = router;