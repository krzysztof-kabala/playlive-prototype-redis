#!/usr/bin/env node
let program = require('commander');
let queue = require('./service/queue');
let db = require('./service/db');
let cache = require('memory-cache');

program
    .version('2.0')
    .option('-w, --workers', 'Number of workers')
    .parse(process.argv);



let collectedItems = {broadcasts: 0, events: 0};
db.getBroadcasts().then(broadcasts => {
    broadcasts.forEach(b => {
        cache.put(b.uniqueid, JSON.stringify(b));
        ++collectedItems['broadcasts'];
    });
});
db.getEvents().then(events => {
    events.forEach(e => {
        cache.put(e.postid, JSON.stringify(e));
        ++collectedItems['events'];
    });
});

console.log('start reading queue');

const workersNumber = parseInt(process.env.WORKERS || 1, 10);
let workers = [];

[...Array(workersNumber).keys()].forEach(i => {
    workers[i] = queue.createRedisWorker();

    workers[i].on( "message", ( msg, next, id ) => {
        queue.processMessage(msg);
        next();
    });

    // optional error listeners
    workers[i].on('error', ( err, msg ) => {
        console.log( "ERROR", err, msg.id );
    });
    workers[i].on('exceeded', ( msg ) => {
        console.log( "EXCEEDED", msg.id );
    });
    workers[i].on('timeout', ( msg ) => {
        console.log( "TIMEOUT", msg.id, msg.rc );
    });

    workers[i].start();
    console.log('worker '+(i+1)+' created!');
});