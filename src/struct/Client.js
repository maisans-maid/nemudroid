const { Client, Collection, version } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
const Mongoose = require(join(__dirname, 'Mongoose.js'));

module.exports = class NemuDroidClient extends Client{
  constructor(settings = {}){
    super(settings);

    // REGISTER_BOT_TOKEN
    if (!this.token && 'TOKEN' in process.env){
      this.token = process.env.TOKEN;
    };

    // SET BOT PREFIX (not needed for slash commands)
    if (typeof settings.prefix !== 'string'){
      settings.prefix = process.env.PREFIX || 'n!';
    };

    // STORE COMMANDS
    this.commands = new Collection();

    this.localcache = {
      serverprofiles: {}
    };

    // INIT DATABASE
    this.database = new Mongoose(this, {
      uri: process.env.MONGO_URI,
      config: {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        autoIndex: false,
        connectTimeoutMS: 10000,
        family: 4
      }
    });

  }
}
