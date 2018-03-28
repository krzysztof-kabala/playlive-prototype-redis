let RedisSMQ = require("rsmq");
let RSMQWorker = require( "rsmq-worker" );
let RSMQPromise = require('rsmq-promise');
let cache = require('memory-cache');
let db = require('../service/db');

Array.prototype.sum = function() {
    return this.reduce(function(a,b){return a+b;});
};

if (!String.prototype.format) {
    String.prototype.format = function() {
        let args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

class Queue {
    constructor() {
        this.queueName = process.env.REDIS_QUEUE;
    }

    getDefaultRsmq() {
        if (!this.defaultRsmq) {
            this.defaultRsmq = new RedisSMQ( {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                ns: process.env.REDIS_NAME,
                connect_timeout: 2*1000,
                max_attempts: 1,
                retry_strategy: function (options) {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        // End reconnecting on a specific error and flush all commands with
                        // a individual error
                        return new Error('The server refused the connection');
                    }
                    if (options.attempt > 10) {
                        // End reconnecting with built in error
                        return undefined;
                    }
                    // reconnect after
                    return Math.min(100);
                }
            } );
        }

        return this.defaultRsmq;
    }

    getRsmq() {
        if (!this.rsmq) {
            this.rsmq = new RSMQPromise( {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                ns: process.env.REDIS_NAME,
                connect_timeout: 2*1000,
                max_attempts: 1,
                retry_strategy: function (options) {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        // End reconnecting on a specific error and flush all commands with
                        // a individual error
                        return new Error('The server refused the connection');
                    }
                    if (options.attempt > 10) {
                        // End reconnecting with built in error
                        return undefined;
                    }
                    // reconnect after
                    return Math.min(100);
                }
            } );
        }

        return this.rsmq;
    }

    createRedisWorker() {
        return new RSMQWorker( this.queueName, {
            interval: [.00001, .00001,.0001, .01, .1],
            rsmq: this.getDefaultRsmq()
        } );
    }

    async processMessage(jsonMessage) {
        const eventArray = JSON.parse(jsonMessage);
        let participations = {};
        let showTime = false;
        eventArray.forEach((taskObject) => {
            if (!showTime) {
                showTime = true;
                const dateDiff = Date.now() - taskObject.date;
                console.log(dateDiff+'ms');
            }

            let e = cache.get(taskObject.postid);
            if (!e) {
                console.log('event not found', taskObject.postid);
                return true;
            }
            e = JSON.parse(e);

            let b = cache.get(e.broadcastuniqueid);
            if (!b) {
                console.log('broadcast not found', e.broadcastuniqueid);
                return true;
            }
            b = JSON.parse(b);

            if (e.status === 1 && b.status === 1) {
                if (!participations.hasOwnProperty(e.postid)) {
                    participations[e.postid] = {};
                }
                if (!participations[e.postid].hasOwnProperty(taskObject.type)) {
                    participations[e.postid][taskObject.type] = 0;
                }

                ++participations[e.postid][taskObject.type];
            }
        });
        Object.keys(participations).forEach(postid => {
            const e = JSON.parse(cache.get(postid));
            Object.keys(participations[postid]).forEach(typeid => {
                const votes = participations[postid][typeid];
                const updateSql = "UPDATE eventaggregation SET participations = participations + {0} WHERE eventuniqueid = '{1}' AND type = '{2}' "
                    .format(votes, e.uniqueid, typeid);
                db.getConnection().raw(updateSql).then(() => {
                    console.log(updateSql);
                }).catch(function(err) {
                    console.error(err);
                });
            })
        });
    }

    readRedisMessages() {
        this.getRsmq().receiveMessage({qname: this.queueName}).then(resp => {
            if (resp && resp.hasOwnProperty('message')) {
                const eventArray = JSON.parse(resp.message);
                eventArray.forEach((taskObject) => {
                    const dateDiff = Date.now() - taskObject.date;

                    console.log(dateDiff+'ms');
                });

                this.deleteRedisMessage(resp.id);
            }
        }).catch();
    }

    deleteRedisMessage(id) {
        this.getRsmq().deleteMessage({qname:this.queueName, id:id});
    }

    async sendRedisMessage(events) {
        let messageArray = [];
        for (let i=0;i<events;i++) {
            messageArray.push(this.createMessage());
        }

        this.getRsmq().sendMessage({
            qname: this.queueName,
            message: JSON.stringify(messageArray)
        }).then(result => {
            // console.log("Message sent. ID:", result);
        }).catch(err => {
            console.error(err);
        });
    }

    createRedisQueue() {
        this.getRsmq().createQueue({qname: this.queueName}).then(done => {
            console.log('Queue created!');
        }).catch(err => {
            console.log(err);
        });;
    }

    createMessage() {
        const randomNumber = Math.floor((Math.random() * 100) + 1);
        const randomFiveNumber = Math.floor((Math.random() * 5) + 1);
        const currentTime = Date.now();

        return {
            message: 'message',
            source: 2,
            date: currentTime,
            userid: 'a@b.c'+randomNumber,
            usertoken: "",
            type: randomFiveNumber,
            postid: 'post'+randomFiveNumber
        };
    }
}

module.exports = new Queue();