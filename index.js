require('dotenv').config();
require('./fonts');

// Set the clock on Manila Time
require('moment-duration-format');
require('moment-timezone');
require('moment').tz.setDefault('Asia/Manila')

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

/*Temporary add an external package for modal creation since it is still unavailable natively on djs*/
require('discord-modal')(client);

client.custom = {
    commands: new Collection(),
    database: require('mongoose'),
    cache: {
        afkUsers: new Collection(),
        eventGame: new Collection(),
        games: new Collection(),
        guildSchemaPartials: new Collection(),
        messageXP: new Collection(),
        voiceChannelXP: new Collection(),
    }
};

client.custom.database.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  autoIndex: false,
  connectTimeoutMS: 10000,
  family: 4
});

client.custom.database.Promise = global.Promise;

client.once('ready', () => console.log(`${client.user.tag} is ready! Listening to ${client.eventNames().length} events!`));
client.custom.database.connection.once('connected', () => console.log('Database connected!'));

const filtrate = f => f.split('.').pop() === 'js';
const load = folder => {
    for (const file of readdirSync(join(__dirname, folder)).filter(filtrate)){
        const item = require(join(__dirname, folder, file));
        const doFor = {
            commands: () => client.custom.commands.set(item.builder.name, item),
            events:   () => client.on(file.split('.')[0], item.bind(null, client))
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
