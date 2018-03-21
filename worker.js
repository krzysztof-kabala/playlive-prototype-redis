#!/usr/bin/env node

let program = require('commander');
let queue = require('./service/queue');

program
    .version('2.0')
    .option('-n, --name', 'Queue name')
    .parse(process.argv);

console.log('start reading queue');
queue.readRedisMessages();