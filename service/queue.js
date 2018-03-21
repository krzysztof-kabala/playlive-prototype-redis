let RedisSMQ = require("rsmq");
let RSMQWorker = require( "rsmq-worker" );

Array.prototype.sum = function() {
    return this.reduce(function(a,b){return a+b;});
};

class Queue {
    constructor() {
        this.rsmq = new RedisSMQ( {host: "redis", port: 6379, ns: "rsmq"} );
        this.queueName = 'playlive';
        this.worker = new RSMQWorker( this.queueName, {interval:[.01],rsmq: this.rsmq} );
        this.messageCount = 0;
        this.messageTimes = [];
    }

    readRedisMessages() {
        console.log(this.messageCount, this.messageTimes);
        this.worker.on( "message", ( msg, next, id ) => {
            const msgObject = JSON.parse(msg);
            if (this.messageCount < 10) {
                this.messageCount++;
                this.messageTimes.push( Date.now()-msgObject.date );
            } else {
                const timeAvg = this.messageTimes.sum() / this.messageTimes.length;
                console.log('processed '+this.messageCount+' messages, average time: '+timeAvg);
                this.messageCount = 0;
                this.messageTimes = [];
            }

            next();
        });

        // optional error listeners
        this.worker.on('error', function( err, msg ){
            console.log( "ERROR", err, msg.id );
        });
        this.worker.on('exceeded', function( msg ){
            console.log( "EXCEEDED", msg.id );
        });
        this.worker.on('timeout', function( msg ){
            console.log( "TIMEOUT", msg.id, msg.rc );
        });

        this.worker.start();
    }

    async sendRedisMessage() {
        this.rsmq.sendMessage({
            qname:this.queueName,
            message: JSON.stringify(this.createMessage())
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