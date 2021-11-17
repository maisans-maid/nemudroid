'use strict';

const { MessageEmbed } = require('discord.js');

module.exports = async (client, member) => {
    const channelId = '907014736544145420';
    const channel = member.guild.channels.cache.get(channelId);

    if (!channel) return;

    if (!member.guild.members.resolve(client.user).permissions.has('VIEW_AUDIT_LOG'))
        return;

    let log;

    for (const type of [ 'MEMBER_BAN_ADD', 'MEMBER_KICK']){
        const initLog = await member.guild.fetchAuditLogs({
            limit: 1, type
        }).then(logs => logs.entries.first());

        if (!initLog) continue;

        // Check if the most recent audit entry was created in a 3 second
        // timeframe this event was fired
        if (Math.abs(initLog.createdAt - Date.now()) > 3000)
            continue;

        log = initLog;
    };

    const description = !log
        ? `${member} (**${member.user.tag}**) left on their own volition!`
        : log.action === 'MEMBER_BAN_ADD'
            ? `${member} (**${member.user.tag}**) was banned by ${log.executor || '<???>'}!`
            : `${member} (**${member.user.tag}**) was kicked by ${log.executor || '<???>'}!`;

    channel.send({
        embeds: [
            new MessageEmbed()
            .setColor('RED')
            .setAuthor('A member has left this server', member.user.displayAvatarURL())
            .setDescription(description)
            .setTimestamp()
        ]
    })
};
