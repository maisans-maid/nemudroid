'use strict';
const { calculateXPFromVoice } = require('../Structures/EXPCalc.js');
const { birthdayGreeter } = require('../util/birthdayGreeter.js');
const { registerCommands } = require('../util/registerCommands.js');
const { setCommandPermissions } = require('../util/setCommandPermissions.js');

module.exports = (client) => {

    // RegisterCommands
    registerCommands(client);

    // SetCommandPermissions
    setCommandPermissions(client);

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

    // Greet birthday celebrants!!!
    birthdayGreeter(client);
    // Run once a day
    setInterval(function(){
        birthdayGreeter(client);
    }, 9504e5);
};
