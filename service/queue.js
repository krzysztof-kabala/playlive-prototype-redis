let RedisSMQ = require("rsmq");
let RSMQWorker = require( "rsmq-worker" );

Array.prototype.sum = function() {
    return this.reduce(function(a,b){return a+b;});
};

class Queue {
    constructor() {
        this.rsmq = new RedisSMQ( {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            ns: process.env.REDIS_NAME
        } );
        this.queueName = process.env.REDIS_QUEUE;
    }

    createRedisWorker() {
        return new RSMQWorker( this.queueName, {
            interval: [.001, .01, .1, 1],
            rsmq: this.rsmq
        } );
    }

    async processMessage(jsonMessage) {
        const eventArray = JSON.parse(jsonMessage);
        eventArray.forEach((taskObject) => {
            const dateDiff = Date.now() - taskObject.date;

            console.log(dateDiff+'ms');
        });
    }

    readRedisMessages() {
        this.rsmq.receiveMessage({qname: this.queueName}, (err, resp) => {
            if (resp && resp.hasOwnProperty('message')) {

                const eventArray = JSON.parse(resp.message);
                eventArray.forEach((taskObject) => {
                    const dateDiff = Date.now() - taskObject.date;

                    console.log(dateDiff+'ms');
                });

                this.deleteRedisMessage(resp.id);
            }
        });
    }

    deleteRedisMessage(id) {
        this.rsmq.deleteMessage({qname:this.queueName, id:id}, (err, resp) => {

        });
    }

    async sendRedisMessage(events) {
        let messageArray = [];
        for (let i=0;i<events;i++) {
            messageArray.push(this.createMessage());
        }

        this.rsmq.sendMessage({
            qname: this.queueName,
            message: JSON.stringify(messageArray)
        }, function (err, resp) {
            // console.log(err, resp);
        });
    }

    createRedisQueue() {
        this.rsmq.createQueue({qname: this.queueName}, function (err, resp) {
            console.log(err, resp);
        });
    }

    createMessage() {
        const randomNumber = Math.floor((Math.random() * 10) + 1);
        const currentTime = Date.now();

        return {
            name: 'message',
            date: currentTime,
            type: 1,
            event: randomNumber
        };
    }
}

module.exports = new Queue();