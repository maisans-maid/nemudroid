'use strict';

const model = require('../models/guildSchema');
const _ = require('lodash');
const { MessageActionRow, MessageButton } = require('discord.js');

exports.processTicketButton = async function (interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('TICKETSYS')) return;

    let document = await model.findById(interaction.guildId).catch(e => e);

    if (!document || document instanceof Error){
       return interaction.reply({
            ephemeral: true,
            content: '❌ Could not load the server configuration!'
        });
    };

    const categoryChannel = interaction.guild.channels.cache.get(document.supportsys.categoryChannelId);

    if (!categoryChannel){
        return interaction.reply({
            ephemeral: true,
            content: '❌ Category channel could not be found. It may have been deleted.'
        });
    };

    const indexIfExists = document.supportsys.categoryChannelChildren.findIndex(x => x.userId);
    const channelIfExists = indexIfExists >= 0
        ? interaction.guild.channels.cache.get(document.supportsys.categoryChannelChildren[indexIfExists].channelId)
        : null;

    if (interaction.customId === 'TICKETSYS-CREATE'){
        return createTicket(interaction, document, indexIfExists, channelIfExists);
    };

    if (interaction.customId === 'TICKETSYS-DISPOSE'){
        return deleteTicket(interaction, document, indexIfExists, channelIfExists);
    };
};

async function createTicket(interaction, document, indexIfExists, channelIfExists){
    if (indexIfExists >= 0 && channelIfExists){
        return interaction.reply({
            ephemeral: true,
            content: `❌ You have an existing support ticket at ${channelIfExists}`
        });
    };

    const channel = await interaction.guild.channels.cache.get(document.supportsys.categoryChannelId).createChannel(
        _.sampleSize('abcdefghijklmnopqrstuvwxyz0123456789'.split(''), 8).join(''),
        {
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [ 'VIEW_CHANNEL' ]
                },
                {
                    id: interaction.member.id,
                    allow: [ 'VIEW_CHANNEL', 'SEND_MESSAGES' ]
                },
                {
                    id: interaction.client.user.id,
                    allow: [ 'VIEW_CHANNEL', 'MANAGE_CHANNELS', 'SEND_MESSAGES']
                }
            ]
        }
    ).catch(e => e);

    if (channel instanceof Error){
        return interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${channel.message}`
        });
    };

    const firstMessage = {
        content: 'If you\'re done with the ticket, please click on the button below to close the ticket. You can check the pinned messages to navigate to this message.',
        components: [
            new MessageActionRow().addComponents(
                new MessageButton()
                .setLabel('Dispose Ticket')
                .setEmoji('📤')
                .setStyle('DANGER')
                .setCustomId('TICKETSYS-DISPOSE')
            )
        ]
    };

    const message = await channel.send(firstMessage).catch(e => e);

    await message.pin();

    if (message instanceof Error){
        return interaction.reply({
            ephemeral: true,
            content: `❌ Error: ${message.message}`
        });
    };

    const childrenInfo = {
        channelId: channel.id,
        userId: interaction.member.id
    };

    if (indexIfExists >= 0){
        document.supportsys.categoryChannelChildren.splice(indexIfExists, 1, childrenInfo);
    } else {
        document.supportsys.categoryChannelChildren.push(childrenInfo);
    };

    return document
    .save()
    .then(() => interaction.deferUpdate())
    .catch(error => interaction.reply(`❌ Error: ${error.message}`));
};

async function deleteTicket(interaction, document, indexIfExists, channelIfExists){
    const index = document.supportsys.categoryChannelChildren.findIndex(x => x.channelId === interaction.channelId);
    if (index >= 0){
        document.supportsys.categoryChannelChildren.splice(index, 1);
    };
    return document.save()
    .then(() => interaction.channel.delete())
    .catch(e => interaction.reply(`❌ Error: ${e.message}`));
};
