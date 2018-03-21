#!/usr/bin/env node
let program = require('commander');
let queue = require('./service/queue');

program
    .version('2.0')
    .option('-w, --workers', 'Number of workers')
    .parse(process.argv);

console.log('start reading queue');

const workersNumber = parseInt(process.env.WORKERS || 10, 10);
let workers = [];

for (let i in [...Array(workersNumber).keys()]) {
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
}