const { SlashCommandBuilder } = require('@discordjs/builders');
const deployCommands = require('../utility/Commands.deploy.js');

const command = new SlashCommandBuilder()
.setName('init')
.setDescription('Initialize bot / Sync commands.');

const allowedPermissions = Guild => Guild.roles.cache
    .filter(role => role.permissions.has('MANAGE_GUILD'))
    .map(role => Object.assign({
        id: role.id,
        type: 'ROLE',
        permission: true,
    }, {}));

module.exports = {
    builder: command,
    permissions: allowedPermissions,
    execute: async (client, interaction) => {

        try {
            await deployCommands(client, interaction.guild);
            return interaction.reply({
                ephemeral: true,
                content: '☑ Successfully registered application (/) commands.'
            });
        } catch (err) {
          return interaction.reply({
              ephemeral: true,
              content: '❌ Failed to register application (/) commands. ' + err.message
          });
        };
    }
};
