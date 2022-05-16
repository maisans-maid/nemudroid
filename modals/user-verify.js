'use strict';
const badwords = require('badwords/array');
const filter = new RegExp(badwords.map(x => `\s*${x}\s*`).join('|'));

module.exports = async interaction => {

    const roleId = interaction.customId.split(':').pop();
    let nick = interaction.fields.getTextInputValue('NICKNAME');
    let response = '🎉 You have been verified! '

    if (filter.test(nick)){
        nick = null;
        response += 'However, we could not set your name due to it containing profanity. Don\'t worry though! You can still set your nickname after reaching specific level.'
    } else {
        response += 'You may be able to change your nickname once you reach a certain level';
    };
    
    if (nick == interaction.user.username) nick = null;

    return interaction.member.edit({ nick, roles: [ roleId ]}).then(() => interaction.reply({
        ephemeral: true,
        content: response
    }))
    .catch(e => interaction.reply({
        ephemeral: true,
        content: `Oops! something wrong has happened (${e.message})`
    }));
};
