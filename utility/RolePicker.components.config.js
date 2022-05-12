'use strict';

const { MessageActionRow, MessageButton } = require('discord.js')

module.exports = interaction => {
    interaction.reply({
        ephemeral: true,
        content: 'How would you like to configure the roles?',
        components: [ new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('ROLEPICKER:ADD')
                .setLabel('Add')
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('ROLEPICKER:REMOVE')
                .setLabel('Remove')
                .setStyle('DANGER'),
            new MessageButton()
                .setCustomId('ROLEPICKER:REORDER')
                .setLabel('Reorder')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('ROLEPICKER:VIEWCONFIG')
                .setLabel('Check Config')
                .setStyle('SECONDARY')
        )]
    })
};
