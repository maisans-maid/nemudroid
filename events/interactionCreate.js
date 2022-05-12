'use strict';

const { MessageActionRow, MessageButton } = require('discord.js');

const handleTicket = require('../processes/ticket-tool/handles/main.js');
const handlePoll = require('../processes/poll/poll.handle.js');

const levelCanvas = require('../utility/Canvas.level.js');
const verifyUser = require('../utility/Member.verify.js');

const lbPaginate = require('../buttons/leaderboard.js');
const manageUser = require('../buttons/user-management.js');
const configureRules = require('../buttons/rules-configure-button.js');
const addRoles = require('../buttons/roles-add.js');


module.exports = async (client, interaction) => {
    if (interaction.isCommand() || interaction.isContextMenu()){
        const command = client.custom.commands.get(interaction.commandName);
        if (!command) return interaction.reply({
            ephemeral: true,
            content: `**${interaction.commandName}** has none or has missing command module.`
        });
        try {
            command.execute(client, interaction);
        } catch (e) {
            const error = {
                ephemeral: true,
                content: `❌ Oops! Something went wrong (${e.message})`

            };
            if (interaction.deferred || interaction.replied){
                return interaction.editReply(error);
            } else {
                return interaction.reply(error);
            };
        };
    };

    if (interaction.isButton()){
        switch(interaction.customId.split(':').reverse().pop()){
            case 'ADDROLE'       : addRoles(interaction);       break;
            case 'BAN'           : manageUser(interaction);     break;
            case 'KICK'          : manageUser(interaction);     break;
            case 'POLL'          : handlePoll(interaction);     break;
            case 'RULES'         : configureRules(interaction); break;
            case 'TICKETSYS'     : handleTicket(interaction);   break;
            case 'VERIFY'        : verifyUser(interaction);     break;
            case 'XP_LEADERBOARD': lbPaginate(interaction);     break;
            default: interaction.reply({
                ephemeral: true,
                content: `❌ Oops! You clicked a stray button~ (${interaction.customId}])`
            });
        };
    };
};
