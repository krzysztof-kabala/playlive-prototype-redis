const uuid = require('uuid');

class Db {
    constructor() {
        this.knex = null;
    }

    getConnection() {
        if (this.knex === null) {
            this.knex = require('knex')({
                client: 'pg',
                version: '9.6',
                connection: {
                    host : process.env.POSTGRES_HOST,
                    user : process.env.POSTGRES_USER,
                    password : process.env.POSTGRES_PASSWORD,
                    database : process.env.POSTGRES_DB
                }
            });
        }

        return this.knex;
    }

    getBroadcasts() {
        return this.getConnection().select('*')
            .from('broadcast')
            .orderBy('uniqueid', 'desc').catch(function(err) {
                console.error(err);
            });
    }

    getEvents() {
        return this.getConnection().select('*')
            .from('event')
            .orderBy('uniqueid', 'desc').catch(function(err) {
                console.error(err);
            });
    }

    createBroadcast(newBroadcast = {}) {
        newBroadcast['uniqueid'] = uuid.v4();
        return this.getConnection().insert(newBroadcast).into('broadcast').catch(function(err) {
            console.error(err);
        });
    }

    createEvent(newEvent = {}) {
        newEvent['uniqueid'] = uuid.v4();
        return this.getConnection().insert(newEvent).into('event').catch(function(err) {
            console.error(err);
        });
    }

    createEventAggregation(newEvent = {}) {
        newEvent['uniqueid'] = uuid.v4();
        return this.getConnection().insert(newEvent).into('eventaggregation').catch(function(err) {
            console.error(err);
        });
    }

    findBroadcast(conditions = {}) {
        return this.getConnection().select('*').from('broadcast').where(conditions).limit(1).first().catch(function(err) {
            console.error(err);
        });
    }

    findEvent(conditions = {}) {
        return this.getConnection().select('*').from('event').where(conditions).limit(1).first().catch(function(err) {
            console.error(err);
        });
    }

    findEventAggregation(conditions = {}) {
        return this.getConnection().select('*').from('eventaggregation').where(conditions).limit(1).first().catch(function(err) {
            console.error(err);
        });
    }
}

module.exports = new Db();