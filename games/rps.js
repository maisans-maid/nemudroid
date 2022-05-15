'use strict';

module.exports = async interaction => {
    interaction.client.custom.cache.games.get(interaction.guildId).delete(interaction.user.id)
    return interaction.reply({
        ephemeral: true,
        content: '🔒 This feature is currently locked'
    });
};
