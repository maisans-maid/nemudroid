require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const { DEVCLIENTID, DEVGUILDID } = process.env;

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs');
const { join } = require('path');

const rest = new REST({ version: '9' }).setToken(process.env.DEVCLIENTTOKEN);

const commands = [];
const filter = (f) => f.split('.').pop() === 'js';

// Get commands to register
for (const commandFile of readdirSync(join(__dirname, 'commands')).filter(f => filter(f))){
  const { builder } = require(join(__dirname, 'commands', commandFile));
  if (builder instanceof SlashCommandBuilder){
    commands.push(builder.toJSON());
  };
};

rest.put(Routes.applicationGuildCommands(DEVCLIENTID, '896822322403627068'),{ body: commands })
.then(() => console.log('Successfully registered application (/) commands.'))
.catch(e => console.log(e));
