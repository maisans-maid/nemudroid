'use strict';

const birthdayGreeter = require('../utility/Member.birthday.js');
const afkInitializer = require('../processes/afk-scanner/initialize.js');
// const verifyMembers = require('../utility/Member.verify.js');
// const cycleMessages = require('../utility/Messages.cycle.js');

module.exports = client => {

    // Get members on VC on startup
    client.guilds.cache.each(guild => guild.members.cache
        .filter(member => Boolean(member.voice))
        .filter(member => !client.custom.cache.voiceChannelXP.has(member.id))
        .each(member => client.emit('voiceStateUpdate', {}, member.voice))
    );

    afkInitializer(client);

    birthdayGreeter(client);
    setInterval(function(){
        birthdayGreeter(client)
    }, 86_400_000);
};
