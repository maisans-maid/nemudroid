require('dotenv').config();
require('./fonts');
require('moment-duration-format');

// Heroku for backup accounts, if the date is 1-25, turn off this instance.
if ('BACKUPMODE' in process.env && new Date().getDate() < 24){
    process.exit(1);
};

const { Intents, Client, Collection, Options } = require('discord.js');
const { join } = require('path');
const { readdirSync } = require('fs');

const client = new Client({
    intents: [ ...Object.keys(Intents.FLAGS) ],
    partials: [ 'MESSAGE' ],
    presence: { status: 'dnd', activities: [{
        name: 'Nemu Plushie',
        type: 'PLAYING',
    }]}
});

client.custom = {
    commands: new Collection(),
    database: require('mongoose'),
    cache: {}
};

client.custom.database.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  autoIndex: false,
  connectTimeoutMS: 10000,
  family: 4
});

client.custom.database.Promise = global.Promise;

client.once('ready', () => console.log(`${client.user.tag} is ready!`));
client.custom.database.connection.once('connected', () => console.log('Database connected!'));

const filtrate = f => f.split('.').pop() === 'js';
const load = folder => {
    for (const file of readdirSync(join(__dirname, folder)).filter(filtrate)){
        const item = require(join(__dirname, folder, file));
        const doFor = {
            commands: () => client.custom.commands.set(item.builder.name, item),
            events:   () => client.on(item.split('.')[0], item.bind(null, client))
        };
        doFor[folder]();
    };
};

load('commands');
load('events');

client.login(process.env.TOKEN);

const ignore = [
    'uncaughtException',
    'unhandledRejection',
    'rejectionHandled'
];

for (const event of ignore) process.on(event, console.error);
