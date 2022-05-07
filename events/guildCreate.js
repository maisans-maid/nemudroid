'use strict';

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs');
const { join } = require('path');

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
const init = require('../commands/init.js');

module.exports = (client, guild) => rest.put(Routes.applicationGuildCommands(client.user.id, guild.id),{ body: [ init.builder.toJSON() ] })
    .then(() => {
        console.log('Successfully registered application (/) commands.');
        return guild.commands.fetch()
    })
    .catch(e => console.log(e.message));
