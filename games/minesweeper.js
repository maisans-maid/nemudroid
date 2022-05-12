'use strict';

module.exports = async interaction => {
    return interaction.reply({
        ephemeral: true,
        content: '🔒 This feature is currently locked'
    });
};
