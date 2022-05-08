'use strict';

const _ = require('lodash');
const { MessageActionRow, MessageButton } = require('discord.js');

module.exports = async function createTicket(interaction, profile, indexIfExists, channelIfExists){
    if (indexIfExists >= 0 && channelIfExists){
        return interaction.reply({
            ephemeral: true,
            content: `❌ You have an existing support ticket at ${channelIfExists}`
        });
    };

    const channel = await interaction.guild.channels.cache.get(profile.channels.supportCategoryId).createChannel(
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
                .setLabel('Dispose Ticket!')
                .setEmoji('📤')
                .setStyle('DANGER')
                .setCustomId('TICKETSYS-END')
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
        profile.channels.supportCategoryChildren.splice(indexIfExists, 1, childrenInfo);
    } else {
        profile.channels.supportCategoryChildren.push(childrenInfo);
    };

    return profile
    .save()
    .then(() => interaction.reply({
        ephemeral: true,
        content: `A channel has been created for you! Please go to ${channel}`
    }))
    .catch(error => interaction.reply(`❌ Error: ${error.message}`));
};
