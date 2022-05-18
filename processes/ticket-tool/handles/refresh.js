'use strict';

const { MessageActionRow, MessageButton } = require('discord.js');

const model = require('../../../models/guildSchema');
const generateEmbed = require('../ticket.embed.js');

module.exports = async function (interaction){

    if (!interaction.member.permissions.has('MANAGE_GUILD')){
        return interaction.reply({
            ephemeral: true,
            content: '❌ You don\'t have the permissions needed to refresh this.'
        })
    }

    const profile = await model.findByIdOrCreate(interaction.guildId).catch(e => e);

    if (profile instanceof Error){
        return interaction.reply({
            ephemeral: true,
            content: `❌ Could not load the server configuration: ${profile.message}`
        });
    };

    const embeds = generateEmbed(interaction, profile);

    const components = [
        new MessageActionRow().addComponents(
            new MessageButton()
            .setCustomId('TICKETSYS-CREATE')
            .setLabel('Create a Ticket!')
            .setEmoji('📩')
            .setStyle('SECONDARY'),
            new MessageButton()
            .setCustomId('TICKETSYS-FEEDBACK')
            .setLabel('Submit a Feedback instead!')
            .setEmoji('🗨')
            .setStyle('SECONDARY'),
            new MessageButton()
            .setCustomId('TICKETSYS-REFRESH')
            .setLabel('Refresh')
            .setEmoji('🔃')
            .setStyle('SUCCESS')
        )
    ];

    await interaction.message.edit({ embeds, components })
    .then(() => interaction.deferUpdate())
    .catch(e => interaction.reply(`❌ Error: ${e.message}`));
};
