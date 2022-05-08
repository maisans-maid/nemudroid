'use strict';

const submitFeedback = require('../modals/feedback-submit.js');
const submitPoll     = require('../modals/poll-submit.js');
const configureRules = require('../modals/rules-configure.js');
const manageUser = require('../modals/user-manage.js');
const reportUser = require('../modals/user-report.js');
const xpReset    = require('../modals/xp-reset.js');

module.exports = async (client, interaction) => {
    if (interaction.customId.startsWith('SUBMIT_FEEDBACK')){
        submitFeedback(interaction);
    };

    if (interaction.customId.startsWith('POLL')){
        submitPoll(interaction);
    };

    if (interaction.customId.startsWith('RULES_MODAL')){
        configureRules(interaction);
    };

    if (interaction.customId.startsWith('BAN') || interaction.customId.startsWith('KICK')){
        manageUser(interaction);
    };

    if (interaction.customId.startsWith('REPORT_USER')){
        reportUser(interaction);
    };

    if (interaction.customId.startsWith('XP_RESET')){
        xpReset(interaction);
    };
};
