'use strict';
const { calculateXPFromVoice } = require('../Structures/EXPCalc.js');

module.exports = (client) => {

    // Get members on voiceChannels on startup
    client.guilds.cache.each(guild => guild
        .members.cache
        .filter(member => Boolean(member.voice.channelId))
        .filter(member => !client.localCache.usersOnVC.has(member.id))
        .each(member => {
            const interval = setInterval(function(){
                return calculateXPFromVoice(client, member.voice);
            }, 60000);

            client.localCache.usersOnVC.set(
                member.id,
                interval[Symbol.toPrimitive]()
            );
        })
    );
};