'use strict';

const { Guild } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs');
const { join } = require('path');

exports.registerCommands = function (client, guild) {
    const rest = new REST({ version: '9' }).setToken(client.token);
    const commands = [];
    const filter = f => f.split('.').pop() === 'js';

    for (const commandFile of readdirSync(join(__dirname, '..', 'commands')).filter(filter)){
        const { builder } = require(join(__dirname, '..' ,'commands', commandFile));
        if (builder instanceof SlashCommandBuilder){
            commands.push(builder.toJSON())
        };
    };

    if (guild instanceof Guild){
        rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands });
    } else {
        client.guilds.cache.each(guild => rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands }));
    };
};
