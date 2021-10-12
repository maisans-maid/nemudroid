require('dotenv').config();
// Require the necessary discord.js classes
const { Intents } = require('discord.js');
const { join }    = require('path');
const { readdirSync } = require('fs');
const Client      = require(join(__dirname, 'struct', 'Client.js'));

// Create a new client instance
const client = new Client({ intents: [
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MEMBERS,
  // Intents.FLAGS.GUILD_BANS,
  Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  Intents.FLAGS.GUILD_INTEGRATIONS,
  Intents.FLAGS.GUILD_WEBHOOKS,
  // Intents.FLAGS.GUILD_INVITES,
  // Intents.FLAGS.GUILD_VOICE_STATES,
  Intents.FLAGS.GUILD_PRESENCES,
  // Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  // Intents.FLAGS.GUILD_MESSAGE_TYPING,
  Intents.FLAGS.DIRECT_MESSAGES,
  Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  // Intents.FLAGS.DIRECT_MESSAGE_TYPING,
] });

/*=============================INIT DATABASE=================================*/
client.database.init();
/*===========================================================================*/




/*==============================LOAD COMMANDS================================*/
try {
  for (const command of readdirSync(join(__dirname, 'commands')).filter(f => f.split('.').pop() === 'js')){
    try {
      const cmd = require(join(__dirname, 'commands', command));
      client.commands.set(cmd.builder.name, cmd.execute);
    } catch (e){
      console.log('\x1b[33m[!]\x1b[0m ' + e.message + ' (on ' + __filename + ')');
    };
  };
} catch (e) {
  console.log('\x1b[31m[X]\x1b[0m ' + e.message + ' (on ' + __filename + ')');
}
/*===========================================================================*/




/*===============================LOAD EVENTS=================================*/
try {
  for (const event of readdirSync(join(__dirname, 'events')).filter(f => f.split('.').pop() === 'js')){
    try {
      client.on(event.split('.')[0], require(join(__dirname, 'events', event)).bind(null, client));
    } catch (e) {
      console.log('\x1b[33m[!]\x1b[0m ' + e.message + ' (on ' + __filename + ')');
    };
  };
} catch (e) {
  console.log('\x1b[31m[X]\x1b[0m ' + e.message + ' (on ' + __filename + ')');
};
/*===========================================================================*/



/*==============================LOGIN CLIENT=================================*/
client.login();
/*===========================================================================*/
