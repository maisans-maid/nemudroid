'use strict';

const model = require('../models/guildSchema');
const _ = require('lodash');
const moment = require('moment');
const { MessageActionRow, MessageButton, Collection, MessageEmbed } = require('discord.js');

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

    const indexIfExists = document.supportsys.categoryChannelChildren.findIndex(x => x.userId === interaction.member.id);
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
                .setLabel('Dispose Ticket!')
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

    const channel = interaction.client
        .guilds.cache.get('874162813977919488')?.channels.cache.get('907014736544145420') ||
        interaction.client
        .guilds.cache.get('896822322403627068')?.channels.cache.get('906996830338965574');

    if (channel){
        let messages = new Collection(), size = 1, before, error;

        await interaction.reply({
            ephemeral: true,
            content: 'Please wait while I collect the transcript of this report. This channel will automatically be deleted afterwards.'
        });

        while (size && !error){
            const fetched = await interaction.channel.messages
                .fetch({ limit: 1, before })
                .catch(e => e);
            if (fetched instanceof Error){
                error = e;
            } else {
                size = fetched.filter(Boolean).size;
                before = fetched.filter(Boolean).sort((A, B) => B.createdAt - A.createdAt).first()?.id;
                messages = messages.concat(fetched);
            };
        };

        if (error){
            sendError(interaction, channel, error);
        };

        const filter = (message) => typeof message === 'object' && message.createdAt && message.author;
        const sort = (messageA, messageB) => messageA.createdAt - messageB.createdAt;

        const document = messages.filter(filter).sort(sort).map(message => {
            const attachments = message.attachments.size ? message.attachments.map(x => `\r\n!(attachment:${x.url})`).join('') : '';

            return `${message.author.tag} : ${message.content} ${attachments}`;
        }).join('\r\n\r\n');

        const reporter = interaction.channel.permissionOverwrites.cache
            .filter(overwrite => overwrite.type === 'member' && overwrite.id !== interaction.client.user.id)
            .map(overwrite => `${interaction.guild.members.cache.get(overwrite.id) || `<@${overwrite.id}`}`).join(', ');

        channel.send({
            files: [{ attachment: Buffer.from(document), name: interaction.channel.name + '.txt' }],
            embeds: [
                new MessageEmbed()
                .setColor('ORANGE')
                .setAuthor('⚙ Ticket Report Transcript')
                .setDescription('Above is the transcript for recently ended ticket for client ' + reporter)
            ]
        }).catch(e => sendError(interaction, channel, e));
    };

    return document.save()
    .then(() => interaction.channel.delete())
    .catch(e => interaction.reply(`❌ Error: ${e.message}`));
};

function sendError(interaction, channel, error){
    return channel.send({
        embeds: [
            new MessageEmbed()
            .setColor('RED')
            .setAuthor('⚙ Ticket Report Transcript (Error)')
            .setDescription(`An error was encountered while parsing the messages on channel **#${interaction.channel.name}**:\n\n${error.message}`)
        ]
    })
};
