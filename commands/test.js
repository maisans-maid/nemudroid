const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

const command = new SlashCommandBuilder()
.setName('test')
.setDescription('Manually trigger various automated bot tasks/events')
.addStringOption(option => option
    .setName('task')
    .setDescription('Task to trigger')
    .addChoices([
        [ 'Joining Member', 'event#guildMemberAdd' ],
        [ 'Leaving Member', 'event#guildMemberRemove' ]
    ])
    .setRequired(true)
);

module.exports = {
    builder: command,
    permissions: new Permissions('MANAGE_GUILD'),
    execute: async (client, interaction) => {

        const action = interaction.options.getString('task');

        if (action === 'event#guildMemberAdd'){
            client.emit('guildMemberAdd', interaction.member);
            return interaction.reply({
                ephemeral: true,
                content: 'The task was successfully triggered!\n\nℹ If you cannot see the desired result, please check the logs.'
            });
        };

        if (action === 'event#guildMemberRemove'){
            client.emit('guildMemberRemove', interaction.member);
            return interaction.reply({
                ephemeral: true,
                content: 'The task was successfully triggered!\n\nℹ If you cannot see the desired result, please check the logs.'
            });
        };
    }
}
