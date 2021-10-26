require('dotenv').config();
require('./fonts');

// Heroku for backup accounts, if the date is 1-25, turn off this instance.
if ('BACKUPMODE' in process.env && new Date().getDate() < 26){
  process.exit(1);
};

const { Intents, Client, Collection } = require('discord.js');
const { join } = require('path');
const { readdirSync } = require('fs');

const client = new Client({
  intents: [ ...Object.values(Intents.FLAGS) ],
  presence: { status: 'dnd', activities: [{
    name: 'Nemuphobia',
    type: 'PLAYING',
  }] }
});

client.commands = new Collection();
client.database = require('mongoose');
client.localCache = {
  guildSchema: new Collection()
};

client.database.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  autoIndex: false,
  connectTimeoutMS: 10000,
  family: 4
});

client.database.Promise = global.Promise;

client.once('ready', () => console.log(`\x1b[32m[O]\x1b[0m ${client.user.tag} is Ready!`));
client.database.connection.once('connected', () => console.log('\x1b[32m[O]\x1b[0m Connected to MongoDB!'));

const filter = (f) => f.split('.').pop() === 'js';

for (const command of readdirSync(join(__dirname, 'commands')).filter(f => filter(f))){
  const cmd = require(join(__dirname, 'commands', command));
  client.commands.set(cmd.builder.name, cmd.execute);
};

for (const event of readdirSync(join(__dirname, 'events')).filter(f => filter(f))){
  const evt = require(join(__dirname, 'events', event));
  client.on(event.split('.')[0], evt.bind(null, client));
};

if ('DEVCLIENTTOKEN' in process.env){
  client.login(process.env.DEVCLIENTTOKEN);
} else {
  client.login(process.env.TOKEN);
};
