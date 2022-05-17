'use strict';
const model = require('../models/guildSchema.js');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = async member => {

    let log;
    for (const type of [ 'MEMBER_BAN_ADD', 'MEMBER_KICK']){
        const initialLog = await member.guild.fetchAuditLogs({ limit: 1, type }).then(logs => logs.entries.first());
        if (!initialLog) continue;

        if (Math.abs(initialLog.createdAt - Date.now()) > 2500) continue;
        log = initialLog;
    };
    let description;
    if (!log){
        description = `${member} (**${member.user.tag}**) left on their own volition!`;
    } else if (log.action === 'MEMBER_BAN_ADD'){
        description = `${member} (**${member.user.tag}**) was banned by ${log.executor || '<???>'}!`;
    } else {
        description = `${member} (**${member.user.tag}**) was kicked by ${log.executor || '<???>'}!`
    };

    const profile = await model.findByIdOrCreate(member.guild.id, {
        'channels.logger': 1
    });

    if (profile instanceof Error){
        return console.log('A message was deleted but i could not retreive database data.');
    };

    const channel = member.guild.channels.cache.get(profile.channels.logger);

    if (!channel){
        return console.log('A message was deleted but there was no channel to log it.');
    };

    return channel.send({
        embeds: [
            new MessageEmbed()
            .setColor('RED')
            .setAuthor({
                name: 'A member has left this server',
                iconURL: member.user.displayAvatarURL()
            })
            .setDescription(description)
            .setTimestamp()
        ]
    });
};
