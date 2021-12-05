'use strict';

const { readdirSync } = require('fs');
const { join } = require('path');

exports.setCommandPermissions = async function (client) {

    const commandWithPermissions = readdirSync(join(__dirname, '..', 'commands'))
        .filter(command => command.split('.').pop() === 'js')
        .map(command => require(join(__dirname, '..', 'commands', command)))
        .filter(command => typeof command.permissions === 'function');


    for (const [GuildId, Guild] of client.guilds.cache){
        const commands = await Guild.commands.fetch();
        let fullPermissions = commands
            .filter(command => commandWithPermissions.some(c => c.builder.name === command.name))
            .map(command => Object.assign({}, {
                id: command.id,
                permissions: commandWithPermissions.find(x => x.builder.name === command.name)
                .permissions(Guild)
                .splice(0, 10) // Since Discord does not permit more than 10 permissions as of the moment
            }));

        const serverWideEnabledCommands = [
            'vkrazzy',
            'ping',
            'eval',
            'nemunnouncement',
            'reload',
            'verify'
        ];

        if (Guild.id !== '874162813977919488' && !('DEVCLIENTTOKEN' in process.env)){
            fullPermissions = fullPermissions.filter(x => commands
                .filter(command => serverWideEnabledCommands.includes(command.name))
                .map(command => command.id)
                .includes(x.id)
            );
        };

        await Guild.commands.permissions.set({ fullPermissions });
    };
};
