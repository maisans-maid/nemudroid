const { SlashCommandBuilder } = require('@discordjs/builders');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { readdirSync } = require('fs');
const { join } = require('path');

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);


/**
 * Client.commands refers to extended Map (collection) of local files (commands)
 * Guild.commands refers to the endpoint for interacting with the guild commands via discord
 */
async function deployCommands(Client, Guild){
    if (!client.ready){
        throw new Error('Could not deploy commands. The client is not yet ready!');
    };

    await rest.put(Routes.applicationGuildCommands(Client.user.id, Guild.id), {
        body: Client.commands.map(c => c.builder.setDefaultPermission(false).toJSON())
    });

    const commands = await Guild.commands.fetch();
    const permissions = commands
        .filter(c => Client.commands.has(c.name))
        .filter(c => Client.commands.get(c.name).permissions)
        .map(command => {
            const getPermissions = Client.commands.get(command.name).permissions;
            return {
                id: command.id,
                permissions: getPermissions(Guild).splice(0,10)
            };
        });

    return Guild.commands.permissions.set({
        fullPermissions: permissions
    });
};

module.exports = deployCommands;
