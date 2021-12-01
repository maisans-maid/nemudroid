'use strict';

const model = require('../models/guildSchema.js');
const { MessageEmbed } = require('discord.js');

exports.nemunnouncement = async function (message) {
    // If the channel from which the message was created was not from
    // announcement channel, ignore it
    if (message.channel.id !== '896685029797822474')
        return;

    console.log(message)

    // Get the log-channels for logging error messages, so that they can be
    // easily traced
    const logChannel = message.client.guilds.cache.get('874162813977919488')
        .channels.cache.get('907014736544145420');

    // Fetch the necessary information from different servers, the channel id,
    // and the role id to use for the announcement. Ignore any servers with null
    // channels
    const documents = await model.find({}, {
        'nemunnouncement': 1,
        '_id': 1
    }).then(document => document
        .filter(d => d.nemunnouncement.channel !== null)
    );

    // Execute the following functions for each guilds that has a channel selected
    for (const { nemunnouncement, _id } of documents){

        // Get the guild from the cache
        const guild = message.client.guilds.cache.get(_id)
        // Get the announcement channel from the guild's channel cache
        const channel = guild.channels.cache.get(nemunnouncement.channel)
        // Get the pinged role from the guild's role cache
        const role = guild.roles.cache.get(nemunnouncement.role)

        // Set message content.
        const messageOptions = {
            content: `${role || '<>'} | ${message.content.replace(/\@everyone/g,'everyone')}`
        };

        // Send the attachments as well if there is any
        if (message.attachments.size)
            messageOptions.files = message.attachment.map(a => a.url).filter(Boolean)

        channel
        .send(messageOptions)
        .catch(err => logChannel.send({
            embeds: [
                embed
                .setColor('RED')
                .setAuthor('⚠️ Announcement Failure')
                .setDescription(`Unable to send nemunnouncement to **${guild.name}**!`)
                .addField('Reason', err.message)
            ]
        }));
    };
};
