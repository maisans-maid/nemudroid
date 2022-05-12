const { SlashCommandBuilder } = require('@discordjs/builders');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs');
const { join } = require('path');

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);


/**
 * Client.custom.commands refers to extended Map (collection) of local files (commands)
 * Guild.commands refers to the endpoint for interacting with the guild commands via discord
 */
async function deployCommands(Client, Guild){
    if (!Client.readyAt){
        throw new Error('Could not deploy commands. The client is not yet ready!');
    };

    const body = Client.custom.commands.map(c => {
        return {
            ...c.builder.toJSON(),
            default_member_permissions: c.permissions.bitfield.toString()
        }
    });

    const register = await rest.put(Routes.applicationGuildCommands(Client.user.id, Guild.id), { body }).catch(e => e);

    if (register instanceof Error){
        throw register;
    };
};

module.exports = deployCommands;
