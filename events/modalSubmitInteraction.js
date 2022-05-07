'use strict';

const ticket = require('../modals/ticket.js');
const xpReset = require('../modals/xp-reset.js');
const poll = require('../modals/poll-submit.js');

module.exports = async (client, interaction) => {
    if (interaction.customId.startsWith('TICKETSYS')){
        ticket(interaction);
    };

    if (interaction.customId.startsWith('XP_RESET')){
        xpReset(interaction);
    };

    if (interaction.customId.startsWith('POLL')){
        poll(interaction);
    };
};
