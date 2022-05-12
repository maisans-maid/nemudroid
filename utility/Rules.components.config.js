'use strict';

const { MessageActionRow, MessageButton } = require('discord.js')

module.exports = interaction => {
    interaction.reply({
        ephemeral: true,
        content: 'How would you like to configure these rules?',
        components: [ new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('RULES:ADD')
                .setLabel('Add')
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('RULES:EDIT')
                .setLabel('Edit')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('RULES:REMOVE')
                .setLabel('Remove')
                .setStyle('DANGER'),
            new MessageButton()
                .setCustomId('RULES:REORDER')
                .setLabel('Reorder')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('RULES:REFRESH')
                .setLabel('Refresh')
                .setStyle('SECONDARY')
        )]
    })
};
