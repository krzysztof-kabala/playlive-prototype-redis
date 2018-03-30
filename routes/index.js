let express = require('express');
let router = express.Router();
let queue = require('../service/queue');
let db = require('../service/db');
let fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({status:200});
});

router.get('/fillDb', function(req, res, next) {
/*    [...Array(100).keys()].forEach(i => {
        const randomI = Math.floor((Math.random() * 10) + 1);
        db.findBroadcast({'name':'broadcast'+randomI}).then(b => {
            db.findEvent({broadcastuniqueid: b.uniqueid}).then(e => {
                [...Array(5).keys()].forEach(ai => {
                    db.createEventAggregation({
                        eventuniqueid: e.uniqueid,
                        name: 'answer'+(ai+1),
                        type: (ai+1)
                    });
                });
            });
        });
    });*/

/*    [...Array(100).keys()].forEach(i => {
        const randomI = Math.floor((Math.random() * 10) + 1);
        db.findBroadcast({'name':'broadcast'+randomI}).then(b => {
            db.createEvent({
                broadcastuniqueid: b.uniqueid,
                postid: 'post'+(i+1)
            });
        });
    });*/

/*
    [...Array(10).keys()].forEach(i => {
        db.createBroadcast({
            name: 'broadcast'+(i+1),
            status: 1,
            postid: 'postid'+(i+1)
        });
    });*/

    res.json({status: 200});
});

router.get('/version', function(req, res, next) {
    fs.readFile('/builddate', "utf8", (err, data) => {
        res.json({status: 200, date: data});
    });
});

router.get('/:max', function(req, res, next) {
    let max = parseInt(req.params.max, 10);
    max = max <=0 ? 1 : max;

    let sum = 0;
    for (let i=0; i<max; i++) { sum += i; }

    res.json({status: 200, sum: sum});
});


module.exports = router;