'use strict';

const globalCommands = [
    'vkrazzy',
    'ping',
    'eval',
    'nemunnouncement',
    'reload',
    'verify'
];

const { processTicketButton } = require('../util/processTicketButton.js');
const { processPollButton } = require('../util/processPollButton.js');

module.exports = (client, interaction) => {

    if (interaction.isCommand()){

        if (
            (interaction.guildId !== '874162813977919488') &&
            (!('DEVCLIENTTOKEN' in process.env)) &&
            !globalCommands.includes(interaction.commandName)
        ) return interaction.reply({
            ephemeral: true,
            content: '❌ This command is exclusive to Nemu Kurosagi\'s server only.'
        });

        const exefunc = client.commands
            .get(interaction.commandName);

        if (!exefunc)
          return interaction.reply({
              content: `${interaction.commandName} has no or has missing command module.`,
              ephemeral: true
          });

        try {
            exefunc(client, interaction);
        } catch(e) {
            interaction[
                interaction.deferred || interaction.replied
                  ? 'editReply'
                  : 'reply'
            ]({
                ephemeral: true,
                content: `❌ Error: ${e.message}`
            });
        };
    };

    if (interaction.isButton()){
        //  Is it a ticket button?
        processTicketButton(interaction);
        // Is it a poll button?
        processPollButton(interaction);
    };
};
