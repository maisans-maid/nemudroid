'use strict';
const model = require('../models/guildSchema.js');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = async message => {

    if (!message.guild){
        return;
    };

    const profile = await model.findByIdOrCreate(message.guild.id, {
        'channels.logger': 1
    });
    if (profile instanceof Error){
        return console.log('A message was deleted but i could not retreive database data.');
    };
    const channel = message.guild.channels.cache.get(profile.channels.logger);
    if (!channel){
        return console.log('A message was deleted but there was no channel to log it.');
    };
    if (channel.id === message.channel.id){
        return console.log('A message was deleted on logging channel')
    };

    const log = await message.guild.fetchAuditLogs({
        limit: 1,
        type: 'MESSAGE_DELETE'
    })
    .then(f => f.entries.first())
    .catch(e => e);

    if (log instanceof Error){
        return console.log(log.message);
    };

    if (!log){
        // A message was deleted but there was no log found
    };

    const { executor, target } = log;

    const embed = new MessageEmbed()
    .setAuthor({
        name: `${target.id === message.author?.id ? executor.tag : message.author?.tag || '???'} deleted a message!`,
        iconURL: 'https://www.pngmart.com/files/3/Delete-Button-PNG-Image.png'
    })
    .addFields([
        {
            name: `Author`,
            value: message.author?.tag || 'Could not identify',
        },
        {
            name: 'Deleted on',
            value: `${moment(Date.now()).format('LLLL')} at <#${message.channelId}>`
        },
        {
            name: 'Content',
            value: message.content?.substring(0, 1000) || '*Empty (Check attachments)*'
        },
        {
            name: 'Attachments',
            value: message.attachments?.map(x => `• [${x.name}](${x.url})`).join('\n').substr(0, 1000) || '*None*'
        }
    ])
    .setColor('RED')
    .setFooter({
        text: '💡 If the message has no content and attachment, and or has unidentified author, the message may have been uncached before it was deleted.'
    });

    const imageAttachments = message.attachments.filter(x => x.contentType.startsWith('image'));

    if (imageAttachments.size){
        embed.setImage(imageAttachments.first().url);
    };


    // Message was deleted by someone else
    return channel.send({
        embeds: [
            embed
        ]
    });
};
