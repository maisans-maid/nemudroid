const mongoose = require('mongoose');
const { readdirSync } = require('fs');
const { join } = require('path');

module.exports = class Mongoose{
  constructor(client, options = {}){

    Object.defineProperty(this, 'client', { value: client });

    this.connector = options.uri || process.env.MONGO_URI;

    this.config = options.config;

    this.db = mongoose;

    this.models = {};

    this.connected = false;

    // Listen to event to set connected to true or false
    this.db.connection.on('connected', () => this.connected = true);
    this.db.connection.on('disconnect', () => this.connected = false);

    // Attach the models
    for (const model of readdirSync(join(__dirname, '..', 'models')).filter(f => f.split('.').pop() == 'js')){
      this.models[model.split('.js')[0]] = require(join(__dirname, '..', 'models', model));
    };
  };

  init(){
    this.db.connect(this.connector, this.config)
    .catch(e => {
      console.log('\x1b[33m[!]\x1b[0m ' + e.message + ' (on ' + __filename + ')');
    });

    this.db.Promise = global.Promise;
    this.db.connection.on('connected', () => console.log('\x1b[32m[O]\x1b[0m Connected to MongoDB!'));

    return this.db;
  };
};
